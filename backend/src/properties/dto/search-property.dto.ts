import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationTier, PropertyType, ReraStatus } from './create-property.dto';

export class SearchPropertyDto {
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(LocationTier) location_tier?: LocationTier;
  @IsOptional() @IsEnum(PropertyType) property_type?: PropertyType;
  @IsOptional() @IsEnum(ReraStatus) rera_status?: ReraStatus;
  @IsOptional() @Type(() => Number) @IsNumber() min_price?: number;
  @IsOptional() @Type(() => Number) @IsNumber() max_price?: number;
  @IsOptional() @Type(() => Number) @IsNumber() page?: number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() limit?: number = 20;
}
