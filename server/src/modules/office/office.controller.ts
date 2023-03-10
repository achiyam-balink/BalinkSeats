import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  Param,
} from '@nestjs/common';
import { OfficeService } from './office.service';
import { CreateOfficeDto } from '../../dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Office')
@Controller('office')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) {}

  @Get(':id')
  getOfficeById(@Param('id') id: string) {
    return this.officeService.findOfficeById(id);
  }

  @Get()
  getOffice(@Query('id') id: string, @Query('number') number: number) {
    if (!id && !number) {
      return this.officeService.findAllOffices();
    }
    return this.officeService.findOffice({ id, number });
  }

  @Post()
  createOffice(@Body() createOfficeDto: CreateOfficeDto) {
    return this.officeService.createOffice(createOfficeDto);
  }

  @Delete(':id')
  deleteOfficeById(@Param('id') id: string) {
    return this.officeService.deleteOfficeById(id);
  }

  @Delete()
  deleteOffice(@Body('number') number: number) {
    return this.officeService.deleteOffice({ number });
  }
}
