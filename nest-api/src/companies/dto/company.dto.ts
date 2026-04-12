import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCompanyDto {
  @IsString() @IsNotEmpty()
  company_code!: string;

  @IsString() @IsNotEmpty()
  company_name!: string;

  @IsInt() @Min(1) @Max(4)
  level!: number;

  @IsString() @IsNotEmpty()
  country!: string;

  @IsString() @IsNotEmpty()
  city!: string;

  @IsInt() @Min(1800) @Max(2100)
  founded_year!: number;

  @IsInt() @Min(0)
  annual_revenue!: number;

  @IsInt() @Min(0)
  employees!: number;
}

export class UpdateCompanyDto {
  @IsOptional() @IsString() @IsNotEmpty()
  company_code?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  company_name?: string;

  @IsOptional() @IsInt() @Min(1) @Max(4)
  level?: number;

  @IsOptional() @IsString() @IsNotEmpty()
  country?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  city?: string;

  @IsOptional() @IsInt() @Min(1800) @Max(2100)
  founded_year?: number;

  @IsOptional() @IsInt() @Min(0)
  annual_revenue?: number;

  @IsOptional() @IsInt() @Min(0)
  employees?: number;
}

export class ListCompaniesQueryDto {
  @IsOptional() @IsInt() @Min(1)
  page?: number; // 1-based

  @IsOptional() @IsInt() @Min(1) @Max(100)
  pageSize?: number;

  @IsOptional() @IsString()
  q?: string; // name/code fuzzy

  @IsOptional() @IsIn(['1','2','3','4'])
  level?: string;

  @IsOptional() @IsString()
  country?: string;

  @IsOptional() @IsString()
  city?: string;
}