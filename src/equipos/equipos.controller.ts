import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  NotFoundException, BadRequestException, InternalServerErrorException,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipos.dto';
import { UpdateEquipoDto } from './dto/update-equipos.dto';
import { SuccessResponseDto } from 'src/common/dto/response.dto';
import { Equipo } from './equipos.entity';
import { Pagination } from 'nestjs-typeorm-paginate';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';

@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) { }

  @Post()
  async create(@Body() dto: CreateEquipoDto) {
    const equipo = await this.equiposService.create(dto);
    return new SuccessResponseDto('Equipo creado correctamente', equipo);
  }

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 30): Promise<SuccessResponseDto<Pagination<Equipo>>> {
    const result = await this.equiposService.findAll({ page, limit });
    if (!result) throw new InternalServerErrorException('Error al obtener equipos');
    return new SuccessResponseDto('Equipos obtenidos correctamente', result);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const equipo = await this.equiposService.findOne(id);
    if (!equipo) throw new NotFoundException('Equipo no encontrado');
    return new SuccessResponseDto('Equipo encontrado', equipo);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateEquipoDto) {
    const equipo = await this.equiposService.update(id, dto);
    if (!equipo) throw new NotFoundException('Equipo no encontrado');
    return new SuccessResponseDto('Equipo actualizado correctamente', equipo);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const equipo = await this.equiposService.remove(id);
    if (!equipo) throw new NotFoundException('Equipo no encontrado');
    return new SuccessResponseDto('Equipo eliminado correctamente', equipo);
  }

  @Post(':id/foto')
  @Post(':id/foto')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './uploads/equipos', // Directorio donde se guardarán las imágenes
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);  // Extraer extensión del archivo
          const filename = `equipo-${uniqueSuffix}${ext}`; // Crear nombre único para cada archivo
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Solo se permiten imágenes'), false);
        }
        callback(null, true);
      },
    })
  )
  async uploadFoto(@Param('id') id: number, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    // Llamar al servicio para guardar la foto del equipo
    const equipo = await this.equiposService.agregarFoto(id, file.filename);

    // Devolver la URL pública de la imagen o el nombre del archivo
    return new SuccessResponseDto('Foto subida correctamente', equipo);
  }
}
