import { LightningElement, wire } from 'lwc';
import getPropertyItems from '@salesforce/apex/PropertyController.getPropertyItems';
import searchPropertyItems from '@salesforce/apex/PropertyController.searchPropertyItems';
import deleteProperty from '@salesforce/apex/PropertyController.deleteProperty';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class Property extends LightningElement {
    // Properties
    propertyItems; // Stores the list of property items
    error; // Stores any errors that occur during data retrieval
    loading = false; // Indicates if data is currently being loaded
    showModal = false; // Controls the visibility of the add/edit modal
    showDeleteModal = false; // Controls the visibility of the delete confirmation modal
    currentPropertyId; // Stores the ID of the currently selected property
    searchTerm = ''; // Stores the search term entered by the user
    selectedFilters = { // Stores the selected filter options
        Small: false,
        Medium: false,
        Large: false
    };
    isEditing = false; // Indicates whether the modal is in edit mode or add mode
    wiredPropertyItemsResult; // Stores the result of the @wire getPropertyItems call

    // Wire service to retrieve property items
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

    // Event handler for input change in search box
    handleInputChange(event) {
        this.searchTerm = event.target.value;
        if (this.searchTerm.length >= 3 || this.searchTerm.length === 0) {
            this.search();
        }
    }

    // Event handler for filter change
    handleFilterChange(event) {
        const filter = event.target.value;
        this.selectedFilters[filter] = event.target.checked;
        this.search();
    }

    // Clears search filters
    clearFilter() {
        this.searchTerm = '';
        this.selectedFilters = {
            Small: false,
            Medium: false,
            Large: false
        };
        this.search();
    }

    // Initiates search
    handleSearch() {
        this.search();
    }

    // Executes property search
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

    // Event handler to add a new property
    handleAddProperty() {
        this.isEditing = false;
        this.showModal = true;
        this.currentPropertyId = null;
    }

    // Event handler for modal close
    handleModalClose() {
        this.showModal = false;
    }

    // Submits form data
    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    // Handles success of form submission
    handleSuccess() {
        this.showModal = false;
        this.showToast('Success', 'Property saved successfully', 'success');
        return refreshApex(this.wiredPropertyItemsResult);
    }

    // Handles error during form submission
    handleError() {
        this.showToast('Error', 'Error saving property', 'error');
    }

    // Displays toast message
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

    // Event handler to edit a property
    handleEditProperty(event) {
        this.isEditing = true;
        this.currentPropertyId = event.target.dataset.id;
        this.showModal = true;
    }

    // Event handler to delete a property
    handleDeleteProperty(event) {
        this.currentPropertyId = event.target.dataset.id;
        this.showDeleteModal = true;
    }

    // Event handler for delete modal close
    handleDeleteModalClose() {
        this.showDeleteModal = false;
        this.currentPropertyId = null;
    }

    // Confirms property deletion
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

    // Computes modal title based on editing state
    get modalTitle() {
        return this.isEditing ? 'Edit Property' : 'Add New Property';
    }

    // Computes submit button label based on editing state
    get submitButtonLabel() {
        return this.isEditing ? 'Save' : 'Add';
    }
}
