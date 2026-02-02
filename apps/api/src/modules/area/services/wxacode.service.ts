import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  FileStorageService,
  UploadedFile,
} from "../../../shared/services/file-storage.service";
import axios from "axios";
import * as crypto from "crypto";

// ============================================
// 类型定义
// ============================================

export interface QrCodeResult {
  url: string;
  path: string;
  generatedAt: Date;
}

export interface BatchResult {
  success: string[];
  failed: Array<{ id: string; error: string }>;
  total: number;
}

interface WxAccessTokenResponse {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

interface WxQrCodeResponse {
  contentType: string;
  buffer: Buffer;
  errcode?: number;
  errmsg?: string;
}

// ============================================
// 小程序码服务
// ============================================

@Injectable()
export class WxacodeService {
  private readonly logger = new Logger(WxacodeService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly tokenRefreshBuffer = 5 * 60 * 1000; // 提前5分钟刷新

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly fileStorage: FileStorageService,
  ) {
    this.appId = this.config.get<string>("WX_APP_ID", "");
    this.appSecret = this.config.get<string>("WX_APP_SECRET", "");

    if (!this.appId || !this.appSecret) {
      this.logger.warn(
        "微信小程序配置未完成，请检查 WX_APP_ID 和 WX_APP_SECRET 环境变量",
      );
    }
  }

  /**
   * 生成单个区域的小程序码
   */
  async generateAreaQrCode(
    areaId: string,
    forceRegenerate = false,
  ): Promise<QrCodeResult> {
    this.logger.log(
      `开始生成区域小程序码: areaId=${areaId}, forceRegenerate=${forceRegenerate}`,
    );

    // 1. 获取区域信息
    const area = await this.prisma.presetArea.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      throw new Error(`区域不存在: ${areaId}`);
    }

    // 2. 检查是否已生成小程序码
    if (!forceRegenerate && area.wxacodeUrl && area.wxacodeGeneratedAt) {
      this.logger.log(`区域 ${area.code} 已存在小程序码，跳过生成`);
      return {
        url: area.wxacodeUrl,
        path: area.wxacodePath || "",
        generatedAt: area.wxacodeGeneratedAt,
      };
    }

    // 3. 获取 access_token
    const accessToken = await this.getAccessToken();

    // 4. 调用微信 API 生成小程序码
    // 微信 scene 参数限制：最大 32 个字符，只支持数字、大小写字母以及部分特殊字符
    // 使用区域 code 的 MD5 哈希前 8 位，确保符合限制
    const scene = this.generateSceneString(area.code);
    this.logger.debug(`生成 scene 参数: ${scene} (原 code: ${area.code})`);
    const qrCodeBuffer = await this.callWxQrCodeApi(accessToken, scene);

    // 5. 上传到 OSS
    const timestamp = Date.now();
    const fileName = `wxacode-area-${area.code}-${timestamp}.png`;
    const objectPath = `wxacode/${fileName}`;

    const uploadFile: UploadedFile = {
      fieldname: "wxacode",
      originalname: fileName,
      encoding: "7bit",
      mimetype: "image/png",
      size: qrCodeBuffer.length,
      buffer: qrCodeBuffer,
    };

    const uploadResult = await this.fileStorage.upload(uploadFile, objectPath);
    this.logger.log(`小程序码上传成功: ${uploadResult.url}`);

    // 6. 更新数据库记录
    await this.prisma.presetArea.update({
      where: { id: areaId },
      data: {
        wxacodeUrl: uploadResult.url,
        wxacodePath: uploadResult.path || objectPath,
        wxacodeScene: scene, // 保存 scene 参数用于反向查询
        wxacodeGeneratedAt: new Date(),
      },
    });

    this.logger.log(`区域 ${area.code} 小程序码生成完成`);

    return {
      url: uploadResult.url,
      path: uploadResult.path || objectPath,
      generatedAt: new Date(),
    };
  }

  /**
   * 批量生成小程序码
   */
  async batchGenerateQrCodes(areaIds: string[]): Promise<BatchResult> {
    this.logger.log(`开始批量生成小程序码: ${areaIds.length} 个区域`);

    const success: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    // 并发控制，每次最多5个并发
    const concurrency = 5;
    for (let i = 0; i < areaIds.length; i += concurrency) {
      const batch = areaIds.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map((id) => this.generateAreaQrCode(id, false)),
      );

      results.forEach((result, index) => {
        const areaId = batch[index];
        if (result.status === "fulfilled") {
          success.push(areaId);
        } else {
          failed.push({
            id: areaId,
            error: result.reason?.message || "未知错误",
          });
        }
      });
    }

    this.logger.log(
      `批量生成完成: 成功 ${success.length}/${areaIds.length}, 失败 ${failed.length}`,
    );

    return {
      success,
      failed,
      total: areaIds.length,
    };
  }

  /**
   * 删除小程序码
   */
  async deleteQrCode(areaId: string): Promise<void> {
    this.logger.log(`开始删除区域小程序码: areaId=${areaId}`);

    // 1. 获取区域信息
    const area = await this.prisma.presetArea.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      throw new Error(`区域不存在: ${areaId}`);
    }

    // 2. 删除 OSS 文件
    if (area.wxacodePath) {
      try {
        await this.fileStorage.delete(area.wxacodePath);
        this.logger.log(`OSS 文件删除成功: ${area.wxacodePath}`);
      } catch (error) {
        this.logger.warn(`删除 OSS 文件失败: ${area.wxacodePath}`, error);
      }
    }

    // 3. 清除数据库记录
    await this.prisma.presetArea.update({
      where: { id: areaId },
      data: {
        wxacodeUrl: null,
        wxacodePath: null,
        wxacodeScene: null, // 清除 scene 映射
        wxacodeGeneratedAt: null,
      },
    });

    this.logger.log(`区域 ${area.code} 小程序码删除完成`);
  }

  /**
   * 通过 scene 查询区域信息
   * 支持新旧两种格式：
   * - 新格式: a{16位哈希} (如: a1a2b3c4d5e6f7g8)
   * - 旧格式: area=code (如: area=1047) 或纯 code (如: 1047)
   */
  async getAreaByScene(scene: string) {
    this.logger.debug(`通过 scene 查询区域: scene=${scene}`);

    let area = null;

    // 1. 尝试新格式：a{16位哈希}
    if (scene && scene.length === 17 && scene.startsWith("a")) {
      this.logger.debug("[Scene] 新格式，使用 wxacodeScene 查询");
      area = await this.prisma.presetArea.findUnique({
        where: { wxacodeScene: scene },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
      });
    }

    // 2. 兼容旧格式：area=code 或纯 code
    if (!area) {
      let areaCode = scene;

      // 如果是 "area=xxx" 格式，提取 code
      if (scene.startsWith("area=")) {
        areaCode = scene.substring(5);
        this.logger.debug("[Scene] 旧格式 (area=xxx)，提取 code:", areaCode);
      } else {
        this.logger.debug("[Scene] 旧格式 (纯 code)，直接使用:", areaCode);
      }

      // 通过 code 查询区域
      area = await this.prisma.presetArea.findFirst({
        where: {
          code: areaCode,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
      });
    }

    if (!area) {
      this.logger.warn(`未找到 scene 对应的区域: scene=${scene}`);
      return null;
    }

    if (!area.isActive) {
      this.logger.warn(`区域已禁用: scene=${scene}, code=${area.code}`);
      return null;
    }

    return area;
  }

  /**
   * 生成符合微信要求的 scene 字符串
   * 微信限制：最大 32 个字符，只支持数字、大小写字母以及部分特殊字符
   */
  private generateSceneString(code: string): string {
    // 使用 MD5 哈希生成唯一标识，取前 16 位（确保不会超过限制）
    const hash = crypto.createHash("md5").update(code).digest("hex");
    const sceneId = hash.substring(0, 16);

    // 格式: a{16位哈希}，总长度 17，符合微信限制
    return `a${sceneId}`;
  }

  /**
   * 从 scene 字符串反向解析原始 code
   * 注意：这是不可逆的，需要在小程序端建立映射关系
   */
  decodeSceneString(scene: string): string | null {
    // 实际使用中需要建立 scene 与 area 的映射表
    // 这里只做格式验证
    if (!scene || scene.length !== 17 || !scene.startsWith("a")) {
      return null;
    }
    return scene.substring(1);
  }

  /**
   * 获取微信 access_token（带缓存）
   */
  private async getAccessToken(): Promise<string> {
    // 检查缓存是否有效
    if (this.accessToken && this.tokenExpiresAt) {
      const now = new Date();
      if (now < this.tokenExpiresAt) {
        this.logger.debug("使用缓存的 access_token");
        return this.accessToken;
      }
    }

    this.logger.log("获取新的 access_token");

    // 调用微信 API 获取 access_token
    const url = "https://api.weixin.qq.com/cgi-bin/token";
    const params = {
      grant_type: "client_credential",
      appid: this.appId,
      secret: this.appSecret,
    };

    try {
      const response = await axios.get<WxAccessTokenResponse>(url, { params });
      const data = response.data;

      if (data.errcode) {
        throw new Error(
          `获取 access_token 失败: ${data.errcode} - ${data.errmsg}`,
        );
      }

      if (!data.access_token) {
        throw new Error("获取 access_token 失败: 响应中没有 access_token");
      }

      // 缓存 token（提前5分钟刷新）
      this.accessToken = data.access_token;
      const expiresInSeconds = data.expires_in || 7200;
      this.tokenExpiresAt = new Date(
        Date.now() + expiresInSeconds * 1000 - this.tokenRefreshBuffer,
      );

      this.logger.log(
        `access_token 获取成功，将在 ${this.tokenExpiresAt.toISOString()} 过期`,
      );

      return this.accessToken;
    } catch (error) {
      this.logger.error("获取 access_token 失败", error);
      throw new Error("获取微信 access_token 失败，请检查配置和网络连接");
    }
  }

  /**
   * 调用微信小程序码 API
   */
  private async callWxQrCodeApi(
    accessToken: string,
    scene: string,
  ): Promise<Buffer> {
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

    const payload = {
      scene,
      page: "pages/user/submit/index",
      check_path: false, // 关闭路径检查（开发阶段或未发布小程序需要关闭）
      width: 430,
      auto_color: false,
      line_color: { r: 0, g: 0, b: 0 },
      is_hyaline: false,
      env_version: "develop",
    };

    this.logger.debug(`调用微信小程序码 API: scene=${scene}`);

    try {
      const response = await axios.post(url, payload, {
        responseType: "arraybuffer",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // 检查响应是否为错误（微信 API 在出错时返回 JSON）
      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        const errorData = JSON.parse(response.data.toString());
        if (errorData.errcode) {
          throw new Error(
            `微信小程序码 API 错误: ${errorData.errcode} - ${errorData.errmsg}`,
          );
        }
      }

      // 返回图片 Buffer
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error("调用微信小程序码 API 失败", error);
      throw new Error(`生成小程序码失败: ${error.message || "未知错误"}`);
    }
  }
}
