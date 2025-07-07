import { Component,Input,Output,EventEmitter} from '@angular/core';

@Component({
  selector: 'app-product-list',
  imports: [],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent {
@Input() product: {id:number,cod:number,description:string,price:number,stock:number} [] = [];
@Output() selectedProduct = new EventEmitter <number>();
@Output() editedProduct = new EventEmitter <number>();

select(id:number){
  this.selectedProduct.emit(id);
}
edit(id:number){
  this.editedProduct.emit(id);
}
}