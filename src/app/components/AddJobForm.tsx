"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchema } from "../lib/validations";
import { createJob } from "../actions/Job";
type JobFormValues = z.infer<typeof createJobSchema>;

const AddJobForm = () => {
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      company: "",
    },
  });

  async function onSubmit(data: JobFormValues) {
    setMessage(null);
    try {
      const response = await createJob(data);
      if (response.success) {
        setMessage({
          text: "Success: Job strictly saved in database!",
          type: "success",
        });
        reset();
      } else {
        setMessage({ text: `Error: ${response?.error}`, type: "error" });
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
      <h2 className="text-xl font-bold mb-4 flex justify-center">Add job</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input
            type="text"
            {...register("title")}
            placeholder="Title"
            className="border p-2 rounded text-black w-full outline-none focus:border-blue-500"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <input
            type="text"
            {...register("company")}
            placeholder="Company name"
            className="border p-2 rounded text-black w-full outline-none focus:border-blue-500"
          />
          {errors.company && (
            <p className="text-red-500 text-sm mt-1">
              {errors.company.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white p-2 cursor-pointer rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Job submit"}
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
};

export default AddJobForm;
