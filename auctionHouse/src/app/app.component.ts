import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { NinoxServiceService } from './ninox-service.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';

interface QueryParams {
  bidderNumber?: string;
  auctionNumber?: string;
  email?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  auctionForm: FormGroup;
  deliveryMethods: string[] = ['Pick up', 'Shipping'];
  queryParams?: QueryParams;
  submissionMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private service: NinoxServiceService
  ) {
    this.auctionForm = this.formBuilder.group({
      bidderNumber: [{ value: '' }, Validators.required],
      auctionNumber: [{ value: '' }, Validators.required],
      email: ['', [Validators.email]],
      deliveryMethod: ['', Validators.required],
      pickupDate: [''],
      pickupInfo: [''],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const client = params['client'];

      if (client) {
        const [auctionNumber, bidderNumber] = client.split('-');
        if (auctionNumber && bidderNumber) {
          this.auctionForm.patchValue({
            bidderNumber,
            auctionNumber,
          });
        }
      }
    });

    this.auctionForm.get('deliveryMethod')?.valueChanges.subscribe((value) => {
      if (value === 'Pick up') {
        this.auctionForm
          .get('pickupDate')
          ?.setValidators([Validators.required]);
      } else {
        this.auctionForm.get('pickupDate')?.clearValidators();
      }
      this.auctionForm.get('pickupDate')?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.auctionForm.valid) {
      const formData = this.auctionForm.value;
      this.service.updateBidderRecord(formData).subscribe(
        () => {
          if (formData.deliveryMethod === 'Shipping') {
            this.submissionMessage =
              'Thank you!<br> Please await a new email with the shipping cost.';
          } else if (formData.deliveryMethod === 'Pick up') {
            this.submissionMessage = `Thank you!<br> We look forward to seeing you at our auction house on ${new Date(
              formData.pickupDate
            ).toLocaleDateString()}.`;
          }
        },
        (error) => {
          this.submissionMessage = error;
        }
      );
    } else {
      console.error('Form is invalid. Check the fields.');
    }
  }
}
