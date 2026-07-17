import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum LocationTier {
  METRO = 'metro',
  TIER1 = 'tier1',
  NONTIER = 'nontier',
}
export enum PropertyType {
  PLOT = 'plot',
  FLAT = 'flat',
  VILLA_SIMPLEX = 'villa_simplex',
  VILLA_DUPLEX = 'villa_duplex',
  VILLA_TRIPLEX = 'villa_triplex',
  RESORT = 'resort',
}
export enum ReraStatus {
  APPROVED = 'approved',
  NON_APPROVED = 'non_approved',
  PRE_LAUNCH = 'pre_launch',
}
export enum ListingType {
  SALE = 'sale',
  RENT = 'rent',
}
export enum ListedBy {
  INDIVIDUAL = 'individual',
  BUILDER = 'builder',
}

export class CreatePropertyDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsString() @IsNotEmpty() location_address: string;
  @IsEnum(LocationTier) location_tier: LocationTier;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() state: string;
  @IsEnum(PropertyType) property_type: PropertyType;
  @IsEnum(ReraStatus) rera_status: ReraStatus;
  @IsOptional() @IsString() rera_number?: string;
  @IsNumber() @Min(0) price_value: number;
  @IsOptional() @IsNumber() @Min(1) @Max(100) daily_lead_cap?: number;
  @IsOptional() @IsEnum(ListingType) listing_type?: ListingType;
  @IsOptional() @IsEnum(ListedBy) listed_by?: ListedBy;
  @IsOptional() @IsInt() @Min(0) bedrooms?: number;
  @IsOptional() @IsInt() @Min(0) bathrooms?: number;
  @IsOptional() @IsNumber() @Min(0) area_sqft?: number;
  @IsOptional() @IsString() project_name?: string;
}
