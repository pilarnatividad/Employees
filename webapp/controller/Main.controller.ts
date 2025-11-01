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
import ReimportsourceModel from "sap/ui/model/resource/ResourceModel";
import * as XLSX from "xlsx";//importar libreria xlsx
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import { ODataListBinding$ChangeEvent } from "sap/ui/model/odata/v4/ODataListBinding";
import Title from "sap/m/Title";

/**
 * @namespace com.logaligroup.employees.controller
 */
export default class Main extends BaseController {
    
    private _sBaseTitle: string = "";
    private _iTotalRecords: number = 0;

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        const oTable = this.byId("table") as Table;
        oTable.attachUpdateFinished(this.onUpdateFinished, this);
        //Guardar el título base
        const oTitle = this.byId("titletable") as Title;
        if (oTitle) {
           
            let resourceModel=(this.getOwnerComponent() as UIComponent).getModel("i18n") as ResourceModel;
            let sTitle= (resourceModel.getResourceBundle() as ResourceBundle).getText("title") as string;
            this._sBaseTitle = sTitle;
        }
    }
    public onUpdateFinished (oEvent:Event): void {
        const oTable = oEvent.getSource()  as Table;
        const iFilteredCount = (oEvent.getParameter("total") as number) ?? 0;
        const oTitle = this.byId("titletable") as Title;

        // Si es la primera vez, guardamos el total global
        if (this._iTotalRecords === 0 && iFilteredCount > 0) {
            this._iTotalRecords = iFilteredCount;
        }
        const iTotal = this._iTotalRecords || iFilteredCount;
        const sTitle = `${this._sBaseTitle} [${iFilteredCount}/${iTotal}]`;

        oTitle.setText(sTitle);

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
        //Forzar actualización del título
        const iTotal = this._iTotalRecords;
        const oTitle = this.byId("titletable") as Title;
        const sTitle = `${this._sBaseTitle} [${iTotal}/${iTotal}]`;
        oTitle.setText(sTitle);
    }
    private async loadXLSXLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
        // Si ya está cargada, no hace falta cargarla otra vez
        if ((window as any).XLSX) {
            resolve();
            return;
        }

        const sUrl = sap.ui.require.toUrl("com/logaligroup/employees/lib/xlsx.full.min.js");
        const script = document.createElement("script");
        script.src = sUrl;
        script.type = "text/javascript";
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
    });
}
     public async  onExportToExcel(): Promise<void> {
             //0.Cargar la librería sólo si no está cargada aún
            await this.loadXLSXLibrary();
            const XLSX = (window as any).XLSX;

             // 1. Obtener la referencia a la tabla
             const oTable = this.byId("table") as Table;

             // 2. Obtener los objetos de datos puros de los contextos
             // 2. Obtener el binding de los items
             // Esto es crucial porque nos da los datos YA FILTRADOS por el FilterBar 
             const aTableData= oTable.getItems().map(item => {
                const ctx = item.getBindingContext("employees");
                return ctx ? ctx.getObject() : {};
             });
             

             // 3. Crear la Hoja de Cálculo (WorkSheet)
            // Usamos 'json_to_sheet' que toma un array de objetos
            const ws  = XLSX.utils.json_to_sheet(aTableData);

             // 6. Crear el Libro de Trabajo (WorkBook)
             const wb = XLSX.utils.book_new();

             // 7. Añadir la hoja al libro con un nombre (ej: "Empleados")
             XLSX.utils.book_append_sheet(wb, ws, "Empleados");

             
            // 8. Generar y descargar el archivo
             XLSX.writeFile(wb, "ListaEmpleados.xlsx");
     }
}