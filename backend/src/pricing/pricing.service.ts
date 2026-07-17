import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PricingService {
  constructor(private dataSource: DataSource) {}

  getMatrix() {
    return this.dataSource.query(
      `SELECT * FROM lead_pricing ORDER BY location_tier, property_type, rera_status`,
    );
  }

  getPrice(locationTier: string, propertyType: string, reraStatus: string) {
    return this.dataSource.query(
      `SELECT price FROM lead_pricing WHERE location_tier = $1 AND property_type = $2 AND rera_status = $3`,
      [locationTier, propertyType, reraStatus],
    );
  }
}
