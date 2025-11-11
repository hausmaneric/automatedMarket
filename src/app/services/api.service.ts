import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { lastValueFrom, throwError, of } from 'rxjs';
import { catchError, timeout } from 'rxjs';
import { ApiResponse, NXResult, NXResultInit } from '../models/nx-result';
import * as resources from '../resources';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly apiTimeout = 30;
  private readonly httpHeaders = new HttpHeaders({
    'Content-type': 'application/json; charset=UTF-8',
    Accept: 'application/json',
  });

  constructor(private http: HttpClient) {}

  async request(
    method: HttpMethod,
    endpoint: string,
    data: any = {},
    process: string = ''
  ): Promise<NXResult> {
    let result: NXResult = { ...NXResultInit };

    try {
      const url = `${resources.apiURL}${endpoint}`;
      let response;

      switch (method) {
        case HttpMethod.POST:
          response = this.http
            .post<ApiResponse>(url, data, { headers: this.httpHeaders, observe: 'response' })
            .pipe(timeout(this.apiTimeout * 1000));
          break;

        case HttpMethod.GET:
          response = this.http
            .get<ApiResponse>(url, {
              headers: this.httpHeaders,
              params: new HttpParams({ fromObject: data }),
              observe: 'response',
            })
            .pipe(timeout(this.apiTimeout * 1000));
          break;

        case HttpMethod.PUT:
          response = this.http
            .put<ApiResponse>(url, data, { headers: this.httpHeaders, observe: 'response' })
            .pipe(timeout(this.apiTimeout * 1000));
          break;

        case HttpMethod.DELETE:
          response = this.http
            .delete<ApiResponse>(url, { headers: this.httpHeaders, observe: 'response' })
            .pipe(timeout(this.apiTimeout * 1000));
          break;

        default:
          throw new Error('Unsupported HTTP method');
      }

      const apiResponse = await lastValueFrom(
        response.pipe(
          catchError((error) => {
            if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
              return of({ status: 408, message: 'Tempo limite esgotado' });
            }

            if (error.status === 0) {
              return of({ status: 408, message: 'Erro de rede ou servidor inacessível' });
            }

            return throwError(() => ({
              status: error.status || 500,
              message: error.message || 'Erro desconhecido no servidor',
            }));
          })
        )
      );

      if ('status' in apiResponse) {
        if ('body' in apiResponse) {
          const { status, body } = apiResponse as HttpResponse<ApiResponse>;
          if (status === 200) {
            result = { ...NXResultInit, ...body };
          } else if (status === 500) {
            result = {
              ...NXResultInit,
              error: true,
              message: 'Server error',
              errorMsg: body!.message || 'Internal server error',
              ...body,
            };
          } else if (status === 408) {
            result = {
              ...NXResultInit,
              error: true,
              message: body!.message || 'Request timeout',
              ...body,
            };
          } else {
            result = {
              ...NXResultInit,
              error: true,
              message: `Unexpected response status: ${status}`,
              ...body,
            };
          }
        } else {
          const { status, message } = apiResponse as { status: number; message: string };
          result = { ...NXResultInit, error: true, message };
        }
      } else {
        result = { ...NXResultInit, error: true, message: 'Unexpected response format' };
      }
    } catch (error: any) {
      result = {
        ...NXResultInit,
        error: true,
        message: `Error in process: ${process}`,
        errorMsg: error.message || 'Unknown error occurred',
      };
    }

    return result;
  }
}
