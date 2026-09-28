"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUser } from "../actions/user";
import { createUserSchema } from "../lib/validations";

type UserFormValues = z.infer<typeof createUserSchema>;

export default function UserTestForm() {

  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
    },
  });

  async function onSubmit(data: UserFormValues) {
    
    setMessage(null);

    try {
      const result = await createUser(data);

      if (result?.success) {
        setMessage({
          text: "Success: User explicitly saved!",
          type: "success",
        });

        
        reset({
          name: "",
          email: "",
        });
      } else if (result.code === "DUPLICATE_RECORD") {
        
        setError("email", {
          type: "server",
          message: result.message,
        });
      } else {
        setMessage({ text: `Error: ${result?.error}`, type: "error" });
      }
    } catch (error) {
      console.error("System Crash Log:", error);
      setMessage({
        text: "Critical Error: Network issue.",
        type: "error",
      });
    }
  }

  return (
    <div className="p-4 border-2 border-gray-300 rounded-md max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 flex justify-center">Add User</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Name Field */}
        <div>
          <input
            type="text"
            {...register("name")}
            placeholder="User Name (min 2 chars)"
            className="border p-2 rounded text-black w-full outline-none focus:border-blue-500"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

       
        <div>
          <input
            type="email"
            {...register("email")}
            placeholder="User Email"
            className="border p-2 rounded text-black w-full outline-none focus:border-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Test Connection"}
        </button>
      </form>

     
      {message && (
        <p
          className={`mt-4 font-semibold text-center ${
            message.type === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
