import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface TaxSlab {
  id?: number;
  taxConfigurationId?: number;
  incomeFrom: number;
  incomeTo: number | null;
  taxRate: number;
  slabOrder: number;
  isResident: boolean;
  description: string;
}

export interface TaxConfiguration {
  id?: number;
  financialYear: string;
  startDate: string;
  endDate: string;
  superEmployeePercentage: number;
  superEmployerPercentage: number;
  superMinimumSalary: number;
  taxFreeThreshold: number;
  defaultResidentStatus: boolean;
  currencyCode: string;
  fortnightsPerYear: number;
  isActive: boolean;
  description: string;
  taxSlabs: TaxSlab[];
}

@Injectable({
  providedIn: 'root'
})
export class TaxConfigService {
  private readonly API_URL = `${environment.apiUrl}/admin/tax`;

  constructor(private http: HttpClient) {}

  // Tax Configuration endpoints
  getAllConfigurations(): Observable<ApiResponse<TaxConfiguration[]>> {
    return this.http.get<ApiResponse<TaxConfiguration[]>>(`${this.API_URL}/configurations`);
  }

  getActiveConfiguration(): Observable<ApiResponse<TaxConfiguration>> {
    return this.http.get<ApiResponse<TaxConfiguration>>(`${this.API_URL}/configurations/active`);
  }

  getConfiguration(id: number): Observable<ApiResponse<TaxConfiguration>> {
    return this.http.get<ApiResponse<TaxConfiguration>>(`${this.API_URL}/configurations/${id}`);
  }

  createConfiguration(config: TaxConfiguration): Observable<ApiResponse<TaxConfiguration>> {
    return this.http.post<ApiResponse<TaxConfiguration>>(`${this.API_URL}/configurations`, config);
  }

  updateConfiguration(id: number, config: TaxConfiguration): Observable<ApiResponse<TaxConfiguration>> {
    return this.http.put<ApiResponse<TaxConfiguration>>(`${this.API_URL}/configurations/${id}`, config);
  }

  deleteConfiguration(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/configurations/${id}`);
  }

  // Tax Slab endpoints
  getSlabs(configId: number): Observable<ApiResponse<TaxSlab[]>> {
    return this.http.get<ApiResponse<TaxSlab[]>>(`${this.API_URL}/configurations/${configId}/slabs`);
  }

  addSlab(configId: number, slab: TaxSlab): Observable<ApiResponse<TaxSlab>> {
    return this.http.post<ApiResponse<TaxSlab>>(`${this.API_URL}/configurations/${configId}/slabs`, slab);
  }

  updateSlab(slabId: number, slab: TaxSlab): Observable<ApiResponse<TaxSlab>> {
    return this.http.put<ApiResponse<TaxSlab>>(`${this.API_URL}/slabs/${slabId}`, slab);
  }

  deleteSlab(slabId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/slabs/${slabId}`);
  }

  initializeDefaultSlabs(configId: number): Observable<ApiResponse<TaxSlab[]>> {
    return this.http.post<ApiResponse<TaxSlab[]>>(`${this.API_URL}/configurations/${configId}/slabs/initialize-defaults`, {});
  }
}
