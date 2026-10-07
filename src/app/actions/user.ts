// "use server";

// import { prisma } from "../lib/prisma";
// import { createUserSchema } from "../lib/validations";


// export async function createUser(data: unknown) {
//   const userValidation = createUserSchema.safeParse(data);

//   if (!userValidation.success) {
//     return { success: false, error: "Invalid data format" };
//   }
//   try {

//     const existingUser = await prisma.user.findUnique({
//       where: { email: userValidation.data.email },
//     });
    // if (existingUser) {
    //   return { success: false, 
    //   code: "DUPLICATE_RECORD",
    //   field: "email",
    //   message: "Email already exists!"
    //   };
    // }
//     const newUser = await prisma.user.create({
//       data: userValidation.data,
//     });
//     return { success: true, user: newUser };


//   } catch (error) {
//     console.error("Database Error:", error);
//     return { success: false, error: "Database failed to create user" };
//   }
// }
