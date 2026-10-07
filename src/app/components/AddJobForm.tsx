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
      company: "", // value change
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7 lg:p-8"
      >
        {/* Form Header */}
        <div className="mb-7">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Add New Job
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Add the details of the job you are applying for.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Job Title */}
          <div className="sm:col-span-2">
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
              className={`w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900
        placeholder:text-gray-400 outline-none transition-all duration-200
        focus:ring-4 focus:ring-blue-500/10
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
          <div>
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
              className={`w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900
        placeholder:text-gray-400 outline-none transition-all duration-200
        focus:ring-4 focus:ring-blue-500/10
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

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Location
            </label>

            <input
              id="location"
              type="text"
              {...register("location")}
              placeholder="e.g. Lahore, Pakistan"
              className={`w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900
        placeholder:text-gray-400 outline-none transition-all duration-200
        focus:ring-4 focus:ring-blue-500/10
        ${
          errors.location
            ? "border-red-500 focus:border-red-500"
            : "border-gray-300 focus:border-blue-500"
        }`}
            />

            {errors.location && (
              <p className="text-red-500 text-sm mt-1.5">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="sm:col-span-2">
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Skills
            </label>

            <input
              id="skills"
              type="text"
              {...register("skills")}
              placeholder="e.g. React, JavaScript, Node.js"
              className={`w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900
        placeholder:text-gray-400 outline-none transition-all duration-200
        focus:ring-4 focus:ring-blue-500/10
        ${
          errors.skills
            ? "border-red-500 focus:border-red-500"
            : "border-gray-300 focus:border-blue-500"
        }`}
            />

            {errors.skills && (
              <p className="text-red-500 text-sm mt-1.5">
                {errors.skills.message}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-1.5">
              Separate multiple skills with commas.
            </p>
          </div>

          {/* Experience Level */}
          <div>
            <label
              htmlFor="experienceLevel"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Experience Level
            </label>

            <select
              id="experienceLevel"
              {...register("experienceLevel")}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300
        bg-white text-gray-900 outline-none transition-all duration-200
        focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="ENTRY">Entry Level</option>
              <option value="MID">Mid Level</option>
              <option value="SENIOR">Senior Level</option>
            </select>
          </div>

          {/* Job Type */}
          <div>
            <label
              htmlFor="jobType"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Job Type
            </label>

            <select
              id="jobType"
              {...register("jobType")}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300
        bg-white text-gray-900 outline-none transition-all duration-200
        focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="PART_TIME">Part Time</option>
              <option value="FULL_TIME">Full Time</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-7">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700
      text-white font-semibold py-3 px-5 rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-blue-500/20
      shadow-sm hover:shadow-md
      disabled:bg-gray-400
      disabled:cursor-not-allowed
      disabled:hover:bg-gray-400"
          >
            {isSubmitting ? "Adding Job..." : "Add Job"}
          </button>
        </div>
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
  );
};
export default AddJobForm;
