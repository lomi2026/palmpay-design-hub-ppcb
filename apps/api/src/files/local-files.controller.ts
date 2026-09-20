import { BadRequestException, Controller, Get, HttpCode, Param, Put, Query, Req, Res } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { FilesService } from './files.service';

@Controller('files/local')
export class LocalFilesController {
  constructor(private readonly files: FilesService) {}

  @Put(':id/object')
  @HttpCode(204)
  async upload(
    @Param('id') id: string,
    @Query('token') token: string | undefined,
    @Req() request: IncomingMessage,
  ) {
    if (!token) throw new BadRequestException('A local storage token is required.');
    await this.files.uploadLocalObject(id, token, request);
  }

  @Get(':id/object')
  async download(
    @Param('id') id: string,
    @Query('token') token: string | undefined,
    @Res() response: ServerResponse,
  ) {
    if (!token) throw new BadRequestException('A local storage token is required.');
    const file = await this.files.readLocalObject(id, token);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', file.bytes.length);
    response.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    response.end(file.bytes);
  }
}
