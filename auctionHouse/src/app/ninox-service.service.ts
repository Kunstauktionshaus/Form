import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { environment, NINOX_API_Endpoint } from './enviroment';

@Injectable({
  providedIn: 'root',
})
export class NinoxServiceService {
  private apiKey: string = environment.apiKey;
  constructor(private http: HttpClient) {}

  findBidderRecord(filters: {}): Observable<any> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.apiKey}`
    );
    const params = { filters: JSON.stringify(filters) };
    return this.http.get<any>(NINOX_API_Endpoint, { headers, params });
  }

  updateBidderRecord(formData: any): Observable<any> {
    const filters = { F: formData.auctionNumber, A: formData.bidderNumber };
    return this.findBidderRecord(filters).pipe(
      switchMap((existingRecord) => {
        if (existingRecord.length > 0) {
          const recordId = existingRecord[0]._id;
          const updatedFields = {
            Z: formData.email,
            R: formData.deliveryMethod === 'Pick up' ? 1 : 2,
            A1: formData.pickupDate,
            B1: formData.pickupInfo,
          };
          return this.http
            .put(
              `${NINOX_API_Endpoint}/${recordId}`,
              { fields: updatedFields },
              {
                headers: new HttpHeaders()
                  .set('Authorization', `Bearer ${this.apiKey}`)
                  .set('Content-Type', 'application/json'),
              }
            )
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
