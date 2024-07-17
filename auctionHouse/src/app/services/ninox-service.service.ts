import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { API_LINK } from '../enviroment';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class NinoxServiceService {
  constructor(private http: HttpClient) {}

  findBidderRecord(filters: {}): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      params = params.append('filters', JSON.stringify(filters));
    }

    return this.http.get<any>(API_LINK, { params: params });
  }

  updateBidderRecord(formData: any): Observable<any> {
    const filters = { A: formData.auctionNumber, B: formData.bidderNumber };
    return this.findBidderRecord(filters).pipe(
      switchMap((existingRecord) => {
        if (existingRecord.length > 0) {
          const recordId = existingRecord[0]._id;
          let method = 0;
          if (
            formData.deliveryMethod === 'Pick up' ||
            formData.deliveryMethod === 'Abholung'
          ) {
            method = 1;
          } else if (
            formData.deliveryMethod === 'Shipping' ||
            formData.deliveryMethod === 'Versand'
          ) {
            method = 2;
          } else {
            method = 4;
          }
          const updatedFields = {
            K: formData.email,
            N1: formData.comments,
            N: method,
            L: formData.pickupDate
              ? formatDate(formData.pickupDate, 'yyyy-MM-dd', 'en-US')
              : '',
            M: formData.pickupInfo,
            I: formData.street,
            W2: formData.houseNumber,
            D2: formData.postalCode,
            C2: formData.city,
            E2: formData.country,
          };
          return this.http
            .put(`${API_LINK}/${recordId}`, { fields: updatedFields })
            .pipe(
              map(() => ({
                _id: recordId,
                message: 'Record updated successfully',
              })),
              catchError((error) => {
                console.error('Error updating record:', error);
                return throwError('Error updating record');
              })
            );
        } else {
          return throwError('Bidder not found');
        }
      }),
      catchError((error) => {
        console.error('Error finding record:', error);
        return throwError(
          'The customer with this bidder number does not exist'
        );
      })
    );
  }
}
