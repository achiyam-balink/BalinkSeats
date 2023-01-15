import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AreaService } from './area.service';
import { CreateAreaDto } from '../dto/area/create-area.dto';

@Controller('area')
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Get(':id')
  async getAreaById(@Param('id') id: string) {
    return await this.areaService.findAreaById(id);
  }

  @Get()
  async getArea(
    @Body('office') office: string,
    @Body('id') id: string,
    @Body('number') number: string,
    @Body('officeNumber') officeNumber: string,
  ) {
    if (!office && !id && !number && !officeNumber) {
      return await this.areaService.findAllAreas();
    }
    return await this.areaService.findArea({
      office,
      id,
      number,
      officeNumber,
    });
  }

  @Post()
  async createArea(@Body() createAreaDto: CreateAreaDto) {
    return await this.areaService.createArea(createAreaDto);
  }
}
