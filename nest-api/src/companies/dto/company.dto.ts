import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'C0001' })
  @IsString()
  @IsNotEmpty()
  company_code!: string;

  @ApiProperty({ example: 'Test Company' })
  @IsString()
  @IsNotEmpty()
  company_name!: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 4 })
  @IsInt()
  @Min(1)
  @Max(4)
  level!: number;

  @ApiProperty({ example: 'China' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ example: 'Beijing' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 2000, minimum: 1800, maximum: 2100 })
  @IsInt()
  @Min(1800)
  @Max(2100)
  founded_year!: number;

  @ApiProperty({ example: 1000000, minimum: 0 })
  @IsInt()
  @Min(0)
  annual_revenue!: number;

  @ApiProperty({ example: 100, minimum: 0 })
  @IsInt()
  @Min(0)
  employees!: number;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'C0002' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  company_code?: string;

  @ApiPropertyOptional({ example: 'New Name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  company_name?: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  level?: number;

  @ApiPropertyOptional({ example: 'China' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  country?: string;

  @ApiPropertyOptional({ example: 'Shanghai' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @ApiPropertyOptional({ example: 2010, minimum: 1800, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  founded_year?: number;

  @ApiPropertyOptional({ example: 999999, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  annual_revenue?: number;

  @ApiPropertyOptional({ example: 200, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  employees?: number;
}

export class ListCompaniesQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, description: '1-based' })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 5000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000) // 对齐 CompaniesService 的 MAX_PAGE_SIZE=5000
  pageSize?: number;

  @ApiPropertyOptional({ example: 'openai', description: 'name/code fuzzy search' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: '2', enum: ['1', '2', '3', '4'] })
  @IsOptional()
  @IsIn(['1', '2', '3', '4'])
  level?: string;

  @ApiPropertyOptional({ example: 'China' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Beijing' })
  @IsOptional()
  @IsString()
  city?: string;
}