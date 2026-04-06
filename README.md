import { AppDataSource } from "../data-source";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { Request, Response } from "express"
const orderRepo = AppDataSource.getRepository(Order);
const itemRepo = AppDataSource.getRepository(OrderItem);
const productRepo = AppDataSource.getRepository(Product);
export const addToCart = async (req: Request, res: Response) => {
    try {
        const { productId, quantity } = req.body;
        const userId = (req as any).user.id;
        let order = await orderRepo.findOne({
            where: {
                user: { id: userId },
                status: "pending"
            }
        })
        if (!order) {
            order = orderRepo.create({
                user: { id: userId },
                status: "pending",
                total_amount: 0
            })
            await orderRepo.save(order)
        }
        const product = await productRepo.findOneBy({ id: productId })
        if (!product) {
            return res.status(404).json({ error: "Product not found" })
        }

        let item = await itemRepo.findOne({
            where: {
                order: { id: order.id },
                product: { id: productId }
            }
        })
        if (item) {
            item.quantity += Number(quantity)
            if(item.quantity<=0)
            {
                await itemRepo.remove(item);
                return res.status(200).json({message:"Item removed from cart"})
            }
        }
        else {
            item = itemRepo.create({
                order,
                product,
                quantity: Number(quantity),
                price_at_purchase: product.price
            })
        }
        await itemRepo.save(item);
        res.status(200).json({ message: "Item added to cart" })
    }
    catch (error: any) {
        res.status(500).json({ error: error.message })
    }
}
export const getMyCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const cart = await orderRepo.findOne({
            where: {
                user: { id: userId },
                status: "pending"
            },
            relations:["items","items.product"]
        })
        res.json(cart||{items:[]})
    }
    catch (error: any) {
        res.status(500).json({ error: error.message })
    }
}
export const removeFromCart=async(req:Request,res:Response)=>{
    try{
        const {itemId}=req.params;
        const userId=(req as any).user.id;
        const item=await itemRepo.findOne({
            where:{
                id:itemId as string,
                order:{user:{id:userId},status:"pending"}
            }
        })
        if(!item)
        {
            return res.status(404).json({error:"Item not found in cart"})
        }
        await itemRepo.remove(item);
        res.status(200).json({message:"Item removed from cart"})
    }
    catch(error:any){
        res.status(500).json(error.message);
        
    }
    
}
