import { NextRequest, NextResponse } from "next/server";
import { generateContractJson } from "@/lib/openai";
import Contract from "@/models/Contract";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to generate contracts" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get the prompt from the request body
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userName = user.name;

    // Generate contract using GPT, retrieve it as a JSON object
    const contractJson = await generateContractJson(
      `This is the user's name: ${userName}. ${prompt}`
    );

    // Save to database with the authenticated user's ID
    const contract = await Contract.create({
      userId: session.user.id, // Use the actual authenticated user's ID
      title:
        contractJson.title || `Contract - ${new Date().toLocaleDateString()}`,
      type: contractJson.type || "custom",
      requirements: prompt,
      content: JSON.stringify(contractJson),
      parties: contractJson.parties || [], // Include parties if generated
      status: "draft",
    });

    // Increment the user's contract count
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { contractsCreated: 1 },
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error("Error generating contract:", error);
    return NextResponse.json(
      { error: "Failed to generate contract" },
      { status: 500 }
    );
  }
}
