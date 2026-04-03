import e, { NextFunction, Request, Response } from "express"

import {z,ZodError} from "zod"
import { sessionStore } from "../store/sessionStore"
import { AppDataSource } from "../data-source"
import { User } from "../entities/User"
export const AuthSchemas={
    register:z.object({
        email:z.string().email("Invalid email format"),
        username:z.string().min(2,"Username is required"),
        password:z.string().min(6,"Password must contain atleast 6 characters")
    }),
    login:z.object({
        email:z.string().email("Invalid email format"),
        password:z.string().min(1,"Password is required")
    }),
    reset:z.object({
        token:z.string().length(6,"code must be 6 digits"),
        newPassword:z.string().min(6,"new password must contain atleats 6 characters")
    })
}
export const validate=(schema:z.ZodObject)=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        try{
            schema.parse(req.body);
            next();
        }
        catch(error)
        {
            if(error instanceof ZodError)
            {
                return res.status(400).json({errors:error.issues.map(e=>e.message)})
                
            }
            next(error)
        }
    }
}
export const requireAuth=async(req:Request,res:Response,next:NextFunction)=>{
    
    const token=req.cookies.session_token;
    if(!token)
    {
        return res.status(401).json({error:"No session found.Please login"})
    }
    const userId=sessionStore.get(token);
    if(!userId)
    {
        res.clearCookie('session_token');
        return res.status(401).json({error:"Session expired"})
    }
    const user=await AppDataSource.getRepository(User).findOneBy({id:userId});

    if(!user || user.is_locked)
    {
        sessionStore.delete(token);
        res.clearCookie('session_token');
        return res.status(403).json({error:"Account is locked and inaccessible"})
    }
    (req as any).user=user;
    next();
}
export const requireAdmin=async(req:Request,res:Response,next:NextFunction)=>{
    const user=(req as any).user;
    
    if(!user || user.role!=='admin')
    {
        return res.status(403).json({error:"Forbidden: Admin access required"})
    }
    next();
}