import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { OrderItem } from "../entities/OrderItem";
import { Order } from "../entities/Order";
import { Product } from "../entities/Product";
import { error } from "node:console";
const orderRepo = AppDataSource.getRepository(Order)
const productRepo = AppDataSource.getRepository(Product)
export const checkout = async (req: Request, res: Response) => {
    try {
        console.log("Inside checkout controller")
        const userId = (req as any).user.id;
        const { payment_method } = req.body;
        if (!payment_method) {
            return res.status(404).json({ error: "Payment method is required" })
        }
        console.log("current User ID from Session",userId)
        const order = await orderRepo.findOne({
            where: {
                user: { id: userId },
                status: "pending"
            },
            relations: ["items", "items.product"]
        })
        console.log("order found in DB:",order?"YES":"NO")
        if (!order || order.items.length === 0) {
            return res.status(400).json({ error: "Your Cart is empty" })
        }
        let total = 0;
        for (const item of order.items) {
            total += item.price_at_purchase * item.quantity;
            if (item.product.stock < item.quantity) {
                return res.status(400).json({ error: `Not enough stock for ${item.product.name}` })
            }
            item.product.stock -= item.quantity;
            await productRepo.save(item.product)
        }
        order.total_amount = total;
        order.payment_method = payment_method;
        order.status = "completed"
        await orderRepo.save(order)
        res.status(200).json({ message: "Order palced successfully", orderId: order.id, final_total: total })
    }
    catch (error: any) {
        res.status(500).json({ error: error.message })
    }

}
export const getOrderHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const orders = await orderRepo.find({
            where: {
                user: { id: userId },
                status: "completed",
            },
            relations: ["items", "items.product"],
            order: { created_at: "DESC" }
        })
        res.status(200).json({ orders })
    }
    catch (error: any) {
        res.status(500).json({ error: error.message })
    }
}
export const getOrderDetails=async(req:Request,res:Response)=>{
    try{
        const {id}=req.params ;
        const userId=(req as any).user.id;
        const order=await orderRepo.findOne({
            where:{
                id:id as string,
                user:{id:userId}
            },
            relations:["items","items.product"]
        })
        if(!order)
        {
            return res.status(404).json({error:"Order not found"})
        }
        res.status(200).json(order)
    }
    catch(error:any)
    {
        res.status(500).json({error:error.message})
    }
}