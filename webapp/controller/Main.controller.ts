import { FilterBar$ClearEvent, FilterBar$SearchEvent } from "sap/ui/comp/filterbar/FilterBar";
import BaseController from "./BaseController";
import Control from "sap/ui/core/Control";
import Input from "sap/m/Input";
import ComboBox from "sap/m/ComboBox";
import MultiComboBox from "sap/m/MultiComboBox";
import Filter from "sap/ui/model/Filter";
import Table from "sap/m/Table";
import FilterOperator from "sap/ui/model/FilterOperator";
import ListBinding from "sap/ui/model/ListBinding";
import Event from "sap/ui/base/Event";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import UIComponent from "sap/ui/core/UIComponent";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
/**
 * @namespace com.logaligroup.employees.controller
 */
export default class Main extends BaseController {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        const oTable = this.byId("table") as Table;
        oTable.attachUpdateFinished(this.onUpdateFinished, this);

    }
    public onUpdateFinished (oEvent:Event): void {
        const oTable = oEvent.getSource()  as Table;
        const iTotal = (oEvent.getParameter("total") as number) ?? 0 ;
        let sTitle = oTable.getHeaderText();
        if (iTotal !== undefined && iTotal > 0){
            sTitle += "[";
            sTitle += `${iTotal}`;
            sTitle += "]";
        }else {
            sTitle += "";
        }
        oTable.setHeaderText(sTitle);

    }

    public onFilterSearchPress (event: FilterBar$SearchEvent): void {
        const aControls = event.getParameter("selectionSet") as Control[];
        const oInput = aControls.find(c => c instanceof Input) as Input;
        const oMultiCombo = aControls.find(c => c instanceof MultiComboBox) as MultiComboBox;

        const sEmployee = oInput?.getValue() ?? "";
        const aSelectedCountries = oMultiCombo?.getSelectedKeys() ?? [];
        const filters: Filter[] = [];
       
        if (sEmployee) {
            filters.push(
                new Filter({
                    filters: [
                        new Filter("EmployeeID", "EQ", sEmployee),
                        new Filter({
                            filters:[
                                new Filter("FirstName", "Contains", sEmployee),
                                new Filter("LastName", "Contains", sEmployee)
                            ],
                            and: false
                        })
                    ],
                    and: false
                })      
            );        
        }
        // Filtro por países seleccionados en el MultiComboBox
        if (aSelectedCountries.length > 0) {
            const aCountryFilters = aSelectedCountries.map(
                (country) => new Filter("Country", FilterOperator.EQ, country)
            );
            filters.push(new Filter({ filters: aCountryFilters, and: false }));
        }
       

        const table = this.byId("table") as Table;
        const binding = table.getBinding("items") as ListBinding;
        binding.filter(filters);
    }
    

    public onClearPress(event: FilterBar$ClearEvent) : void{
        const aControls = event.getParameter("selectionSet") as Control[];
        const oInput = aControls.find(c => c instanceof Input) as Input;
        const oMultiCombo = aControls.find(c => c instanceof MultiComboBox) as MultiComboBox;
        // Limpiar valores de los filtros
        if (oInput) {
            oInput.setValue("");
        }
        if (oMultiCombo) {
            oMultiCombo.removeAllSelectedItems(); // Limpia todas las selecciones
            // o alternativamente:
            // oMultiCombo.setSelectedKeys([]);
        } 
        this.onFilterSearchPress(event);
        const oTable = this.byId("table") as Table;
        let resourceModel=(this.getOwnerComponent() as UIComponent).getModel("i18n") as ResourceModel;
        let sTitle= (resourceModel.getResourceBundle() as ResourceBundle).getText("title") as string;
        oTable.setHeaderText(sTitle);
    }
}