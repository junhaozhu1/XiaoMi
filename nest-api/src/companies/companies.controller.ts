import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, ListCompaniesQueryDto, UpdateCompanyDto } from './dto/company.dto';

@Controller()
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  // GET /companies?page=1&pageSize=10&q=xx&level=1&country=China&city=Beijing
  @Get('companies')
  list(@Query() query: ListCompaniesQueryDto) {
    return this.companies.list(query);
  }

  // GET /companies/:id
  @Get('companies/:id')
  getById(@Param('id') id: string) {
    return this.companies.getById(Number(id));
  }

  // 备用：GET /companies/by-code/:code
  @Get('companies/by-code/:code')
  getByCode(@Param('code') code: string) {
    return this.companies.getByCode(code);
  }

  // POST /companies
  @Post('companies')
  create(@Body() dto: CreateCompanyDto) {
    return this.companies.create(dto);
  }

  // PATCH /companies/:id
  @Patch('companies/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companies.update(Number(id), dto);
  }

  // DELETE /companies/:id
  @Delete('companies/:id')
  remove(@Param('id') id: string) {
    return this.companies.remove(Number(id));
  }
}