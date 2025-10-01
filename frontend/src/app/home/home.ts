import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth';
import { HeaderComponent } from '../header/header';
import { AccommodationService, Accommodation, AccommodationFilters, FilterOptions } from '../accommodation/accommodation';
import { AccommodationCardComponent } from '../shared/accommodation-card/accommodation-card.component';
import { AccommodationDetailsDialogComponent } from '../shared/dialogs/accommodation-details/accommodation-details-dialog.component';
import { BookingDialogComponent } from '../shared/dialogs/booking/booking-dialog.component';
import {
  LucideAngularModule,
  Filter,
  Search,
  Plus
} from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, AccommodationCardComponent, AccommodationDetailsDialogComponent, BookingDialogComponent, LucideAngularModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly accommodationService = inject(AccommodationService);

  protected currentUser$ = this.authService.currentUser$;

  // Register Lucide icons
  readonly Filter = Filter;
  readonly Search = Search;
  readonly Plus = Plus;
  protected accommodations = signal<Accommodation[]>([]);
  protected isLoading = signal(false);
  protected filterOptions = signal<FilterOptions['data'] | null>(null);

  // Filter states
  protected filters = signal<AccommodationFilters>({
    per_page: 12,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Search and filter form values
  protected searchQuery = signal('');
  protected selectedType = signal('');
  protected selectedCapacity = signal<number | null>(null);
  protected priceRange = signal({ min: 0, max: 1000 });
  protected showFilters = signal(false);

  // Pagination
  protected currentPage = signal(1);
  protected totalPages = signal(1);
  protected totalItems = signal(0);

  // Dialog state
  protected showDetailsDialog = signal(false);
  protected showBookingDialog = signal(false);
  protected selectedAccommodation = signal<Accommodation | null>(null);

  ngOnInit() {
    // Load user data and accommodations
    this.authService.getCurrentUser().subscribe({
      error: (error) => {
        console.error('Failed to load user data:', error);
      }
    });

    // Only load filter options for clients
    if (!this.isAgency()) {
      this.loadFilterOptions();
    }

    this.updateLoadAccommodationsForAgency();
  }

  protected loadFilterOptions(): void {
    this.accommodationService.getFilterOptions().subscribe({
      next: (response) => {
        if (response.success) {
          this.filterOptions.set(response.data);
          this.priceRange.set({
            min: response.data.price_range.min,
            max: response.data.price_range.max
          });
        }
      },
      error: (error) => {
        console.error('Failed to load filter options:', error);
      }
    });
  }

  protected loadAccommodations(): void {
    this.isLoading.set(true);

    const currentFilters = this.filters();
    this.accommodationService.getAccommodations(currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.accommodations.set(response.data.data);
          this.currentPage.set(response.meta.current_page);
          this.totalPages.set(response.meta.last_page);
          this.totalItems.set(response.meta.total);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load accommodations:', error);
        this.isLoading.set(false);
      }
    });
  }

  protected applyFilters(): void {
    const newFilters: AccommodationFilters = {
      ...this.filters(),
      search: this.searchQuery() || undefined,
      type: this.selectedType() || undefined,
      capacite: this.selectedCapacity() || undefined,
      min_price: this.priceRange().min || undefined,
      max_price: this.priceRange().max || undefined,
    };

    this.filters.set(newFilters);
    this.loadAccommodations();
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('');
    this.selectedCapacity.set(null);
    const filterOpts = this.filterOptions();
    if (filterOpts) {
      this.priceRange.set({
        min: filterOpts.price_range.min,
        max: filterOpts.price_range.max
      });
    }

    this.filters.set({
      per_page: 12,
      sort_by: 'created_at',
      sort_order: 'desc'
    });

    this.loadAccommodations();
  }

  protected toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  protected onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.applyFilters();
  }

  protected onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedType.set(target.value);
    this.applyFilters();
  }

  protected onCapacityChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCapacity.set(target.value ? Number(target.value) : null);
    this.applyFilters();
  }

  protected getTypeDisplayName(type: string): string {
    switch (type) {
      case 'hotel': return 'Hotel';
      case 'maison': return 'House';
      case 'studio': return 'Studio';
      default: return type;
    }
  }

  protected getDefaultImage(): string {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
  }

  protected formatPrice(amount: number, unit: string): string {
    return `${amount} MAD/${unit}`;
  }

  protected trackByAccommodation(index: number, accommodation: Accommodation): number {
    return accommodation?.id || index;
  }

  // Event handlers for template
  protected onMinPriceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newMin = +target.value;
    this.priceRange.set({
      min: newMin,
      max: this.priceRange().max
    });
  }

  protected onMaxPriceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newMax = +target.value;
    this.priceRange.set({
      min: this.priceRange().min,
      max: newMax
    });
  }

  protected onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newFilters = {
      ...this.filters(),
      sort_by: target.value as 'created_at' | 'tarif_amount' | 'capacite' | 'titre'
    };
    this.filters.set(newFilters);
    this.loadAccommodations();
  }

  protected onPreviousPage(): void {
    if (this.currentPage() > 1) {
      const newFilters = {
        ...this.filters(),
        page: this.currentPage() - 1
      };
      this.filters.set(newFilters);
      this.loadAccommodations();
    }
  }

  protected onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      const newFilters = {
        ...this.filters(),
        page: this.currentPage() + 1
      };
      this.filters.set(newFilters);
      this.loadAccommodations();
    }
  }


  // Card event handlers
  protected onFavoriteAccommodation(accommodation: Accommodation): void {
    console.log('Favorite clicked:', accommodation.titre);
    // TODO: Implement favorite functionality
  }

  protected onViewAccommodationDetails(accommodation: Accommodation): void {
    console.log('View details clicked:', accommodation.titre);
    this.selectedAccommodation.set(accommodation);
    this.showDetailsDialog.set(true);
  }

  protected onBookAccommodation(accommodation: Accommodation): void {
    console.log('Book now clicked:', accommodation.titre);
    this.selectedAccommodation.set(accommodation);
    this.showBookingDialog.set(true);
  }

  // Dialog event handlers
  protected onCloseDetailsDialog(): void {
    this.showDetailsDialog.set(false);
    this.selectedAccommodation.set(null);
  }

  protected onBookFromDialog(accommodation: Accommodation): void {
    console.log('Booking from dialog:', accommodation.titre);
    this.onCloseDetailsDialog();
    this.selectedAccommodation.set(accommodation);
    this.showBookingDialog.set(true);
  }

  protected onCloseBookingDialog(): void {
    this.showBookingDialog.set(false);
    this.selectedAccommodation.set(null);
  }

  protected onBookingCompleted(event: {reservationId: number, paymentId: number}): void {
    console.log('Booking completed successfully!', event);
    // You could show a success message, redirect to reservations page, etc.
    // For now, we'll just close the dialog
    this.onCloseBookingDialog();
  }

  // Agency-specific methods
  protected isAgency(): boolean {
    const currentUser = this.authService.getCurrentUserSync();
    return currentUser?.role === 'agence';
  }

  protected openCreateForm(): void {
    console.log('Opening create accommodation form');
    // TODO: Implement create form modal or navigate to create page
  }

  protected onEditAccommodation(accommodation: Accommodation): void {
    console.log('Edit clicked:', accommodation.titre);
    // TODO: Implement edit functionality
  }

  protected onDeleteAccommodation(accommodation: Accommodation): void {
    console.log('Delete clicked:', accommodation.titre);
    if (confirm(`Are you sure you want to delete "${accommodation.titre}"?`)) {
      // TODO: Implement delete functionality
      console.log('Accommodation deleted');
    }
  }

  // Update loadAccommodations to filter by agency if user is agency
  private updateLoadAccommodationsForAgency(): void {
    const currentUser = this.authService.getCurrentUserSync();
    if (currentUser?.role === 'agence') {
      // For agencies, load only their accommodations without filters
      const basicFilters: AccommodationFilters = {
        page: this.currentPage(),
        per_page: 12
        // TODO: Add agency_id filter when API supports it
      };

      this.accommodationService.getAccommodations(basicFilters)
        .subscribe({
          next: (response) => {
            if (response?.success && response.data) {
              this.accommodations.set(response.data.data);
              this.totalPages.set(response.data.last_page);
              this.totalItems.set(response.data.total);
            }
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading accommodations:', error);
            this.isLoading.set(false);
          }
        });
    } else {
      // For clients, use existing filter logic
      this.loadAccommodations();
    }
  }
}
