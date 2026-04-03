import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import bcrypt from "bcrypt"
import crypto from 'crypto'
import { sessionStore } from "../store/sessionStore";
import { User } from "../entities/User";
const userRepository=AppDataSource.getRepository("User");
export const register=async(req:Request,res:Response)=>{
    try{
        const {email,username,password}=req.body;
        const exists=await userRepository.findOneBy({email});
        if(exists)
        {
            return res.status(400).json({error:"Email already exists"})
        }
        const password_hash=await bcrypt.hash(password,10);
        const user=userRepository.create({email,username,password_hash});
        await userRepository.save(user);
        
        res.status(201).json({Message:"Registration Successful"})

    }
    catch(e)
    {
        res.status(500).json({error:"Server error"})
    }
};
export const login=async(req:Request,res:Response)=>{
    try{
        const {email,password}=req.body;
        const user=await userRepository.findOneBy({email});
        if(!user|| !(await bcrypt.compare(password,user.password_hash)))
        {
            return res.status(401).json({error:"Invalid Credentials"})
        }
        if(user.is_locked)
        {
            res.status(403).json({error:"Account is locked"})
        }
        const token=crypto.randomBytes(32).toString('hex');
        sessionStore.set(token,user.id);
        
        res.cookie('session_token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:'strict',
            maxAge:24*60*60*1000

        })
        res.json({message:"Login Successful",role:user.role}) 
    }
    catch(e)
    {
        res.status(500).json({error:"Server error"})
    }
    console.log(sessionStore)
    console.log("role of user:")
}

export const forgotPassword=async (req:Request,res:Response)=>{
    
    const {email}=req.body;
    const user=await userRepository.findOneBy({email});
    if(user)
    {
        const code=Math.floor(100000+Math.random()*90000).toString();
        user.reset_password_token=code;

        user.reset_password_expires=new Date(Date.now()+15*60*1000);
        await userRepository.save(user);
        return res.json({message:"Code generated",mock_display_code:code})
    }
    res.json({message:"If email exists,code generated"});
}

export const resetPassword=async(req:Request,res:Response)=>{
    const {token,newPassword}=req.body;
    const user=await userRepository.findOneBy({reset_password_token:token})
    if(!user || !user.reset_password_expires || user.reset_password_expires<new Date())
    {
        return res.status(400).json({error:"Invalid or Expired Code"})
    }
    user.password_hash=await bcrypt.hash(newPassword,10);
    user.reset_password_expires=null;
    user.reset_password_expires=null;
    await userRepository.save(user);
    res.json({message:"Password reset successful"})
};

export const logout=(req:Request,res:Response)=>{
    const token=req.cookies.session_token;
    if(token)
    {
        sessionStore.delete(token);
    }
    res.clearCookie("session_token",{
        httpOnly:true,
        secure:process.env.NODE_ENV==='production',
        sameSite:'strict',
        path:'/'
    })
    res.json({message:"Logged Out"})
    console.log(sessionStore)
}