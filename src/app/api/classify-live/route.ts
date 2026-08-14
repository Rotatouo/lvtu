import { createClassifyHandler } from "./handler";
import { classifyTravelImage } from "@/lib/dashscope";

export const POST = createClassifyHandler(classifyTravelImage);
