import { LightningElement, wire } from 'lwc';
import getPropertyItems from '@salesforce/apex/PropertyController.getPropertyItems';
import updatePropertyItems1 from '@salesforce/apex/PropertyController.updatePropertyItems1';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const COLUMNS = [
    { label: 'Name', fieldName: 'Name', type: 'text', editable: true },
    { label: 'Description', fieldName: 'Description__c', type: 'text' },
    { label: 'Price', fieldName: 'Price__c', type: 'currency', typeAttributes: { currencyCode: 'INR' } },
    { label: 'Property Type', fieldName: 'PropertyType__c', type: 'text' },
];

export default class PropertyDataTable extends LightningElement {
    propertyItems;
    draftValues = [];
    error;
    columns = COLUMNS;
    wiredPropertiesResult;

    @wire(getPropertyItems)
    wiredProperties(result) {
        this.wiredPropertiesResult = result;
        const { error, data } = result;
        if (data) {
            this.propertyItems = data;
            this.error = undefined;
        } else if (error) {
            this.error = error.body ? error.body.message : error;
            this.propertyItems = undefined;
        }
    }

    handleSave(event) {
        const updatedFields = event.detail.draftValues;

        // Call Apex method to update the records
        updatePropertyItems1({ data: updatedFields })
            .then(() => {
                // Show success message
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Properties updated',
                        variant: 'success'
                    })
                );

                // Clear draft values
                this.draftValues = [];

                // Refresh the table with updated data
                return refreshApex(this.wiredPropertiesResult);
            })
            .catch(error => {
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating or reloading properties',
                        message,
                        variant: 'error'
                    })
                );
            });
    }
}
