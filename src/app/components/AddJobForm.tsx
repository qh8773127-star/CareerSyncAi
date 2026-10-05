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
          text: "Success: Job strictly saved",
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
    <div className="w-full max-w-3xl mx-auto mt-8 sm:mt-12 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-7">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Add New Job
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Add the details of the job you are applying for.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Job Title */}
          <div className="w-full">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Job Title
            </label>

            <input
              id="title"
              type="text"
              {...register("title")}
              placeholder="e.g. Frontend Developer"
              className={`w-full px-4 py-2.5 rounded-lg border text-gray-900
              placeholder:text-gray-400 outline-none transition
              focus:ring-2 focus:ring-blue-500/20
              ${
                errors.title
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />

            {errors.title && (
              <p className="text-red-500 text-sm mt-1.5">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Company */}
          <div className="w-full">
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Company Name
            </label>

            <input
              id="company"
              type="text"
              {...register("company")}
              placeholder="e.g. Microsoft"
              className={`w-full px-4 py-2.5 rounded-lg border text-gray-900
              placeholder:text-gray-400 outline-none transition
              focus:ring-2 focus:ring-blue-500/20
              ${
                errors.company
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />

            {errors.company && (
              <p className="text-red-500 text-sm mt-1.5">
                {errors.company.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700
            text-white font-medium py-2.5 px-4 rounded-lg
            transition duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2
            disabled:bg-gray-400
            disabled:cursor-not-allowed
            disabled:hover:bg-gray-400"
          >
            {isSubmitting ? "Submitting..." : "Add Job"}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div
            className={`mt-5 p-3 rounded-lg text-sm font-medium text-center ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};
export default AddJobForm;
