import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../modules/auth/decorators/decorators';
import { AttachmentService } from '../services/attachment.service';
import { FileStorageService } from '../../../shared/services/file-storage.service';
const OSS = require('ali-oss');

@ApiTags('attachments')
@Controller('attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttachmentController {
  constructor(
    private attachmentService: AttachmentService,
    private fileStorage: FileStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @UploadedFile() file: any,
    @Body() body: { ticketId?: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // 验证文件类型
    const isImage = this.fileStorage.validateImageType(file.mimetype);
    const isVideo = this.fileStorage.validateVideoType(file.mimetype);

    if (!isImage && !isVideo) {
      throw new BadRequestException('只支持图片和视频文件');
    }

    // 上传文件到存储服务
    const uploadResult = await this.fileStorage.upload(file, 'attachments');

    // 确定文件类型
    const type = isVideo ? 'VIDEO' : 'IMAGE';

    // 创建附件记录
    return this.attachmentService.create({
      type,
      url: uploadResult.url,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType,
      ticketId: body.ticketId,
      uploadedById: user.id,
    });
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: '上传多个文件' })
  @ApiConsumes('multipart/form-data')
  async uploadFiles(
    @UploadedFiles() files: any[],
    @Body() body: { ticketId?: string },
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const attachments = [];

    for (const file of files) {
      // 验证文件类型
      const isImage = this.fileStorage.validateImageType(file.mimetype);
      const isVideo = this.fileStorage.validateVideoType(file.mimetype);

      if (!isImage && !isVideo) {
        continue; // 跳过不支持的文件类型
      }

      // 上传文件到存储服务
      const uploadResult = await this.fileStorage.upload(file, 'attachments');

      // 确定文件类型
      const type = isVideo ? 'VIDEO' : 'IMAGE';

      // 创建附件记录
      const attachment = await this.attachmentService.create({
        type,
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        ticketId: body.ticketId,
        uploadedById: user.id,
      });

      attachments.push(attachment);
    }

    return { data: attachments, count: attachments.length };
  }

  @Get()
  @ApiOperation({ summary: '获取附件列表' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('ticketId') ticketId?: string,
    @Query('type') type?: string,
  ) {
    return this.attachmentService.getMany({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      ticketId,
      type: type as any,
    });
  }

  @Get('upload-credentials')
  @ApiOperation({ summary: '获取文件上传凭证（用于客户端直传）' })
  async getUploadCredentials(@Query('dir') dir = 'attachments') {
    try {
      return this.fileStorage.getUploadCredentials(dir);
    } catch (error) {
      // 如果不支持，返回一个特殊错误码
      throw new BadRequestException('OSS直传未配置，请使用传统上传');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取附件详情' })
  async findOne(@Param('id') id: string) {
    return this.attachmentService.getOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除附件' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.attachmentService.delete(id, user.id);
  }

  @Post('upload-to-oss')
  @ApiOperation({ summary: '客户端直传OSS（带凭证验证）' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadToOss(
    @UploadedFile() file: any,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    // 验证文件
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // 验证凭证参数
    const { objectName, credentials } = body;
    if (!objectName || !credentials) {
      throw new BadRequestException('缺少必要参数：objectName 或 credentials');
    }

    try {
      // 使用凭证上传到OSS
      const credentialsObj = JSON.parse(credentials);
      const ossClient = new OSS({
        region: credentialsObj.region,
        accessKeyId: credentialsObj.accessKeyId,
        accessKeySecret: credentialsObj.accessKeySecret,
        stsToken: credentialsObj.securityToken,
        endpoint: credentialsObj.endpoint,
      });

      // 上传文件
      await ossClient.put(objectName, file.buffer, {
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      // 返回上传成功的URL
      const url = `https://${credentialsObj.bucket}.${credentialsObj.region}.aliyuncs.com/${objectName}`;

      return {
        success: true,
        url,
      };
    } catch (error) {
      console.error('OSS上传失败:', error);
      throw new BadRequestException(`OSS上传失败: ${error.message}`);
    }
  }
}
