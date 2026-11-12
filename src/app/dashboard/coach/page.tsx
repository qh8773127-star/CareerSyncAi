import CareerCoachPage from "@/app/components/CareerCoachPage";
import { Suspense } from "react";

const CoachPage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading Chat...</div>}>
        <CareerCoachPage />
      </Suspense>
    </div>
  );
};

export default CoachPage;
