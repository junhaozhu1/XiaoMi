import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'abc12345' })
  @IsString()
  password!: string;
}

export class SignupDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'abc12345', description: '至少8位，且包含字母和数字' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: '密码至少8位，且包含字母和数字',
  })
  password!: string;

  @ApiPropertyOptional({ example: 'Alice' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}