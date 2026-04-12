"use server"

import db from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"

export const handleSignUp = async () => {
    try{
        const user = await currentUser();

        if(!user){
            return {
                success: false,
                message: "User not found",
            }
        }

        const {id,firstName,lastName,emailAddresses,imageUrl} = user;

        const newUser = await db.user.upsert({
            where: {    
                clerkId: id,
            },
            update: {
                name: firstName&&lastName?`${firstName} ${lastName}`: firstName || lastName || null,
                image: imageUrl || null,
                email: emailAddresses[0]?.emailAddress || "",
            },
            create: {
                clerkId: id,
                name: firstName&&lastName?`${firstName} ${lastName}`: firstName || lastName || null,
                image: imageUrl || null,
                email: emailAddresses[0]?.emailAddress || "",
            },
        })

        return {
            success: true,
            message: "User created successfully",
            user: newUser,
        }
    }
    catch(error){
        console.log(error)
        return {
            success: false,
            message: "User not found",
        }
    }

}

export const getUser = async () => {
    try {
        const user = await currentUser();
        if(!user){
            return {
                success: false,
                message: "User not found",
            }
        }
        const dbUser = await db.user.findUnique({
            where: {
                clerkId: user.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                clerkId: true,
                tier: true,
                tokens: true,
            }
        })
        return {
            success: true,
            message: "User found successfully",
            user: dbUser,
        }
    } catch (error) {
        console.log(error)
        return {
            success: false,
            message: "User not found",
        }
    }
}