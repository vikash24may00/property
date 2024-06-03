// import { LightningElement, wire } from 'lwc';
// import getPropertyItems from '@salesforce/apex/PropertyController.getPropertyItems';
// import updatePropertyItems1 from '@salesforce/apex/PropertyController.updatePropertyItems1';
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import { refreshApex } from '@salesforce/apex';

// const COLUMNS = [
//     { label: 'Name', fieldName: 'Name', type: 'text', editable: true },
//     { label: 'Description', fieldName: 'Description__c', type: 'text' },
//     { label: 'Price', fieldName: 'Price__c', type: 'currency', typeAttributes: { currencyCode: 'INR' } },
//     { label: 'Property Type', fieldName: 'PropertyType__c', type: 'text' },
// ];

// export default class PropertyDataTable extends LightningElement {
//     propertyItems;
//     draftValues = [];
//     error;
//     columns = COLUMNS;
//     wiredPropertiesResult;

//     @wire(getPropertyItems)
//     wiredProperties(result) {
//         this.wiredPropertiesResult = result;
//         const { error, data } = result;
//         if (data) {
//             this.propertyItems = data;
//             this.error = undefined;
//         } else if (error) {
//             this.error = error.body ? error.body.message : error;
//             this.propertyItems = undefined;
//         }
//     }

//     handleSave(event) {
//         const updatedFields = event.detail.draftValues;

//         // Call Apex method to update the records
//         updatePropertyItems1({ data: updatedFields })
//             .then(() => {
//                 // Show success message
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Success',
//                         message: 'Properties updated',
//                         variant: 'success'
//                     })
//                 );

//                 // Clear draft values
//                 this.draftValues = [];

//                 // Refresh the table with updated data
//                 return refreshApex(this.wiredPropertiesResult);
//             })
//             .catch(error => {
//                 let message = 'Unknown error';
//                 if (Array.isArray(error.body)) {
//                     message = error.body.map(e => e.message).join(', ');
//                 } else if (typeof error.body.message === 'string') {
//                     message = error.body.message;
//                 }

//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Error updating or reloading properties',
//                         message,
//                         variant: 'error'
//                     })
//                 );
//             });
//     }
// }

import { LightningElement, wire, track } from 'lwc';
import getPropertyItems from '@salesforce/apex/PropertyController.getPropertyItems';
import updatePropertyItems1 from '@salesforce/apex/PropertyController.updatePropertyItems1';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import deletePropertyItem from '@salesforce/apex/PropertyController.deletePropertyItem';

const COLUMNS = [
    { label: 'Name', fieldName: 'Name', type: 'text', editable: { fieldName: 'isEditable' } },
    { label: 'Description', fieldName: 'Description__c', type: 'text', editable: { fieldName: 'isEditable' } },
    { label: 'Price', fieldName: 'Price__c', type: 'currency', typeAttributes: { currencyCode: 'INR' }, editable: { fieldName: 'isEditable' } },
    { label: 'Property Type', fieldName: 'PropertyType__c', type: 'text', editable: { fieldName: 'isEditable' } },
    {
        type: 'action',
        typeAttributes: { rowActions: [
            { label: 'Edit', name: 'edit' },
            { label: 'Delete', name: 'delete' }
        ]}
    }
];

export default class PropertyDataTable extends LightningElement {
    @track propertyItems;
    @track draftValues = [];
    @track error;
    @track editableRow = null; // Track the editable row
    columns = COLUMNS;
    wiredPropertiesResult;

    @wire(getPropertyItems)
    wiredProperties(result) {
        this.wiredPropertiesResult = result;
        const { error, data } = result;
        if (data) {
            this.propertyItems = data.map(item => {
                return { ...item, isEditable: false };
            });
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

                // Clear draft values and reset editable row
                this.draftValues = [];
                this.editableRow = null;

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

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {
            case 'edit':
                this.editRow(row);
                break;
            case 'delete':
                this.deleteRow(row);
                break;
            default:
        }
    }

    editRow(row) {
        // Set all rows to non-editable
        this.propertyItems = this.propertyItems.map(item => {
            return { ...item, isEditable: item.Id === row.Id };
        });

        // Set the editable row ID and prepare draft values for the selected row
        this.editableRow = row.Id;
        this.draftValues = [{ ...row }];
    }

    deleteRow(row) {
        // Call Apex method to delete the record
        deletePropertyItem({ propertyId: row.Id })
            .then(() => {
                // Show success message
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Property deleted',
                        variant: 'success'
                    })
                );

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
                        title: 'Error deleting property',
                        message,
                        variant: 'error'
                    })
                );
            });
    }
}
