import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RowService } from './row.service';
import { CreateRowDto } from '../dto/row/create-row.dto';

@Controller('row')
export class RowController {
  constructor(private readonly rowService: RowService) {}

  @Get(':id')
  getRowById(@Param('id') id: string) {
    return this.rowService.findRowById(id);
  }

  @Get()
  getRow(
    @Body('id') id: string,
    @Body('number') number: number,
    @Body('description') description: string,
    @Body('area') area: string,
    @Body('areaNumber') areaNumber: string,
  ) {
    if (!id && !number && !description && !area && !areaNumber) {
      return this.rowService.findAllRows();
    }
    return this.rowService.findRow({
      id,
      number,
      description,
      area,
      areaNumber,
    });
  }

  @Post()
  createRow(@Body() createRowDto: CreateRowDto) {
    return this.rowService.createRow(createRowDto);
  }
}
