import { LightningElement, wire } from 'lwc';
import getPropertyItems from '@salesforce/apex/PropertyController.getPropertyItems';
import searchPropertyItems from '@salesforce/apex/PropertyController.searchPropertyItems';
import deleteProperty from '@salesforce/apex/PropertyController.deleteProperty';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

// birthday
export default class Property extends LightningElement {
    propertyItems;
    error;
    loading = false;
    showModal = false;
    showDeleteModal = false;
    currentPropertyId;
    searchTerm = '';
    selectedFilters = {
        Small: false,
        Medium: false,
        Large: false
    };
    isEditing = false;

    wiredPropertyItemsResult;

    @wire(getPropertyItems)
    wiredPropertyItems(result) {
        this.wiredPropertyItemsResult = result;
        if (result.data) {
            this.propertyItems = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.propertyItems = undefined;
        }
    }

    handleInputChange(event) {
        this.searchTerm = event.target.value;
        if (this.searchTerm.length >= 3 || this.searchTerm.length === 0) {
            this.search();
        }
    }

    handleFilterChange(event) {
        const filter = event.target.value;
        this.selectedFilters[filter] = event.target.checked;
        this.search();
    }

    clearFilter() {
        this.searchTerm = '';
        this.selectedFilters = {
            Small: false,
            Medium: false,
            Large: false
        };
        this.search();
    }

    handleSearch() {
        this.search();
    }

    search() {
        this.loading = true;
        const filters = Object.keys(this.selectedFilters).filter(key => this.selectedFilters[key]);
        searchPropertyItems({ searchKeywords: this.searchTerm, filters: filters })
            .then(result => {
                this.propertyItems = result;
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.propertyItems = undefined;
            })
            .finally(() => {
                this.loading = false;
            });
    }

    handleAddProperty() {
        this.isEditing = false;
        this.showModal = true;
        this.currentPropertyId = null;
    }

    handleModalClose() {
        this.showModal = false;
    }

    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleSuccess() {
        this.showModal = false;
        this.showToast('Success', 'Property saved successfully', 'success');
        return refreshApex(this.wiredPropertyItemsResult);
    }

    handleError() {
        this.showToast('Error', 'Error saving property', 'error');
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

    handleEditProperty(event) {
        this.isEditing = true;
        this.currentPropertyId = event.target.dataset.id;
        this.showModal = true;
    }

    handleDeleteProperty(event) {
        this.currentPropertyId = event.target.dataset.id;
        this.showDeleteModal = true;
    }

    handleDeleteModalClose() {
        this.showDeleteModal = false;
        this.currentPropertyId = null;
    }

    confirmDeleteProperty() {
        this.loading = true;
        deleteProperty({ propertyId: this.currentPropertyId })
            .then(() => {
                this.showToast('Success', 'Property deleted successfully', 'success');
                return refreshApex(this.wiredPropertyItemsResult);
            })
            .catch(error => {
                this.showToast('Error', 'Error deleting property', 'error');
            })
            .finally(() => {
                this.loading = false;
                this.showDeleteModal = false;
            });
    }

    /*
      Returns the title of the modal based on whether we are editing an existing
      property or creating a new one.
      @returns {string} The title of the modal
     */
     get modalTitle() {
         return this.isEditing ? 'Edit Property' : 'Add New Property';
     }

    /*
      Returns the label to display on the submit button based on whether we are
      editing an existing property or creating a new one.
      @returns {string} the label to display on the submit button
     */
     get submitButtonLabel() {
         return this.isEditing ? 'Save' : 'Add';
     }
}
