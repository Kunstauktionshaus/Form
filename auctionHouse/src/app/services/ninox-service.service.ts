import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { API_LINK } from '../enviroment';
import moment from 'moment';

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
    const filters = { F: formData.auctionNumber, A: formData.bidderNumber };
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
          } else {
            method = 2;
          }
          const updatedFields = {
            Z: formData.email,
            R: method,
            A1: moment(formData.pickupDate).format('YYYY-MM-DD'),
            B1: formData.pickupInfo,
          };
          return this.http
            .put(`${API_LINK}/${recordId}`, { fields: updatedFields })
            .pipe(
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