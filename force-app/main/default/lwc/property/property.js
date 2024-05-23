import { LightningElement, wire} from 'lwc';
import getPropertyItems from '@salesforce/apex/PropertyController.getPropertyItems';
import searchPropertyItems from '@salesforce/apex/PropertyController.searchPropertyItems';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Property extends LightningElement {
    propertyItems;
    error;
    loading = false;
    showModal = false;
    showEditModal = false;
    currentPropertyId;
    searchTerm = '';
    selectedFilters = {
        Small: false,
        Medium: false,
        Large: false
    };

    @wire(getPropertyItems)
    wiredPropertyItems({ error, data }) {
        this.extractData(error, data);
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
                this.extractData(undefined, result);
            })
            .catch(error => {
                this.error = error;
                this.propertyItems = undefined;
            })
            .finally(() => {
                this.loading = false;
            });
    }

    extractData(error, data) {
        if (data) {
            this.propertyItems = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.propertyItems = undefined;
        }
    }

    handleAddProperty() {
        this.showModal = true;
    }

    handleModalClose() {
        this.showModal = false;
        this.showEditModal = false;
    }

    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        if (!fields.Name || !fields.Description__c || !fields.Price__c || !fields.Image__c || !fields.PropertyType__c) {
            this.showToast('Error', 'Please fill in all required fields', 'error');
        } else {
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        }
    }

    handleSuccess() {
        this.showModal = false;
        this.showEditModal = false;
        this.showToast('Success', 'Property saved successfully', 'success');
        this.refreshPropertyList();
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

    refreshPropertyList() {
        this.loading = true;
        getPropertyItems()
            .then(result => {
                this.extractData(undefined, result);
            })
            .catch(error => {
                this.error = error;
                this.propertyItems = undefined;
            })
            .finally(() => {
                this.loading = false;
            });
    }

    handleEditProperty(event) {
        this.currentPropertyId = event.target.dataset.id;
        this.showEditModal = true;
    }

    handleEditSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleCancelEdit() {
        this.showEditModal = false;
    }
}
