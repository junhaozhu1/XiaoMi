import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, ListCompaniesQueryDto, UpdateCompanyDto } from './dto/company.dto';

@ApiTags('companies')
@Controller()
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  // GET /companies?page=1&pageSize=10&q=xx&level=1&country=China&city=Beijing
  @Get('companies')
  @ApiOperation({ summary: 'List companies (pagination + filters)' })
  @ApiOkResponse({ schema: { example: { page: 1, pageSize: 10, total: 0, items: [] } } })
  list(@Query() query: ListCompaniesQueryDto) {
    return this.companies.list(query);
  }

  // GET /companies/:id
  @Get('companies/:id')
  @ApiOperation({ summary: 'Get company by id' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNotFoundResponse({ description: 'Company not found' })
  getById(@Param('id') id: string) {
    return this.companies.getById(Number(id));
  }

  // 备用：GET /companies/by-code/:code
  @Get('companies/by-code/:code')
  @ApiOperation({ summary: 'Get company by code' })
  @ApiParam({ name: 'code', example: 'C0001' })
  @ApiNotFoundResponse({ description: 'Company not found' })
  getByCode(@Param('code') code: string) {
    return this.companies.getByCode(code);
  }

  // POST /companies
  @Post('companies')
  @ApiOperation({ summary: 'Create company' })
  @ApiCreatedResponse({ description: 'Created company' })
  @ApiBadRequestResponse({ description: 'Validation error / company_code already exists' })
  create(@Body() dto: CreateCompanyDto) {
    return this.companies.create(dto);
  }

  // PATCH /companies/:id
  @Patch('companies/:id')
  @ApiOperation({ summary: 'Update company' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBadRequestResponse({ description: 'No fields to update / validation error' })
  @ApiNotFoundResponse({ description: 'Company not found' })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companies.update(Number(id), dto);
  }

  // DELETE /companies/:id
  @Delete('companies/:id')
  @ApiOperation({ summary: 'Delete company' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNotFoundResponse({ description: 'Company not found' })
  remove(@Param('id') id: string) {
    return this.companies.remove(Number(id));
  }
}