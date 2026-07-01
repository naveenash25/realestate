import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateEnquiryDto {
  @IsUUID() property_id: string;
  @IsString() @IsNotEmpty() buyer_name: string;
  @IsString() @IsNotEmpty() buyer_phone: string;
}
