import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { NinoxServiceService } from './services/ninox-service.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { CountryGroup, countries } from './countries';

interface QueryParams {
  bidderNumber?: string;
  auctionNumber?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  auctionForm: FormGroup;
  countries: CountryGroup[] = countries;
  deliveryMethods: string[] = ['Abholung', 'Versand', 'Mail Boxes Etc.'];
  queryParams?: QueryParams;
  submissionMessage: string | null = null;
  currentLang: 'en' | 'de' = 'de';
  shippingCase: number = 1;

  myFilter = (d: Date | null): boolean => {
    const day = (d || new Date()).getDay();
    return day !== 0 && day !== 1 && day !== 6;
  };

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private service: NinoxServiceService
  ) {
    this.auctionForm = this.formBuilder.group({
      bidderNumber: [{ value: '' }, Validators.required],
      auctionNumber: [{ value: '' }, Validators.required],
      email: ['', [Validators.email]],
      comments: [''],
      deliveryMethod: ['', Validators.required],
      pickupDate: [''],
      pickupInfo: [''],
      street: [''],
      houseNumber: [''],
      postalCode: [''],
      city: [''],
      country: [''],
      countryCode: [''],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const client = params['client'];

      if (client) {
        const [auctionNumber, bidderNumber, shippingCase] = client.split('-');
        if (auctionNumber && bidderNumber && shippingCase) {
          this.shippingCase = +shippingCase;
          if (this.shippingCase === 3) {
            this.deliveryMethods = ['Abholung', 'Mail Boxes Etc.'];
          }
          this.auctionForm.patchValue({
            bidderNumber,
            auctionNumber,
          });
        }
      }
    });

    this.auctionForm.get('deliveryMethod')?.valueChanges.subscribe((value) => {
      if (value === 'Pick up' || value === 'Abholung') {
        this.auctionForm
          .get('pickupDate')
          ?.setValidators([Validators.required]);
      } else {
        this.auctionForm.get('pickupDate')?.clearValidators();
      }
      this.auctionForm.get('pickupDate')?.updateValueAndValidity();
    });
  }

  switchLanguage(language: 'en' | 'de'): void {
    this.currentLang = language;
    this.updateDeliveryMethods();
  }

  updateDeliveryMethods(): void {
    this.deliveryMethods =
      this.currentLang === 'de'
        ? ['Abholung', 'Versand', 'Mail Boxes Etc.']
        : ['Pick up', 'Shipping', 'Mail Boxes Etc'];
  }

  onSubmit() {
    if (this.auctionForm.valid) {
      const formData = this.auctionForm.value;
      this.service.updateBidderRecord(formData).subscribe(
        () => {
          if (
            formData.deliveryMethod === 'Shipping' ||
            formData.deliveryMethod === 'Versand' ||
            formData.deliveryMethod === 'Mail Boxes Etc.'
          ) {
            this.currentLang === 'en'
              ? (this.submissionMessage =
                  'Thank you!<br> Please await a new email with the shipping cost.')
              : (this.submissionMessage =
                  'Vielen Dank für Ihre Auswahl!<br> Innerhalb der nächsten Woche erhalten sie eine Mail mit einem Kostenangebot für den Versand von uns.');
          } else if (
            formData.deliveryMethod === 'Pick up' ||
            formData.deliveryMethod === 'Abholung'
          ) {
            this.currentLang === 'en'
              ? (this.submissionMessage = `Thank you!<br> We look forward to seeing you at our auction house on ${new Date(
                  formData.pickupDate
                ).toLocaleDateString()}.`)
              : (this.submissionMessage = `Vielen Dank für Ihre Auswahl! <br> Wir freuen uns darauf, Sie in unserem Auktionshaus am ${new Date(
                  formData.pickupDate
                ).toLocaleDateString()}.`);
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
