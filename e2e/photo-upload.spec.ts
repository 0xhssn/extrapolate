import { test, expect } from "@playwright/test";

// Test configuration
const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test_user@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPassword123!";
const CREDITS_TO_BUY = 50; // Enough for multiple image generations
const SAMPLE_IMAGE_PATH = "./e2e/test-image.jpg"; // Ensure this image exists

test.describe("Photo Upload User Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/");
  });

  test("Complete User Journey: Sign In → Buy Credits → Upload Photo → View Results", async ({
    page,
    context,
  }) => {
    // 1. Sign In
    await page.getByRole("button", { name: /sign in/i }).click();

    // Assuming email/password authentication
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /continue/i }).click();

    // Wait for navigation after sign in
    await page.waitForURL("**/", { timeout: 10000 });

    // 2. Buy Credits
    await page.getByRole("button", { name: /user icon/i }).click();
    await page.getByRole("button", { name: /buy credits/i }).click();

    // Select a credit package and purchase
    const creditPackageButton = await page.getByRole("button", {
      name: new RegExp(`Buy ${CREDITS_TO_BUY} Credits`, "i"),
    });
    await creditPackageButton.click();

    // Confirm Stripe checkout (mock or real)
    // This might require specific handling based on your Stripe integration
    await page.waitForURL("**/checkout", { timeout: 10000 });

    // Simulate or complete Stripe checkout
    // Actual implementation depends on your Stripe test mode configuration

    // 3. Upload Photo
    // Locate the photo upload area
    const uploadInput = await page.getByLabel(/upload/i);
    await uploadInput.setInputFiles(SAMPLE_IMAGE_PATH);

    // Wait for image processing
    await page.waitForSelector('[data-testid="output-image"]', {
      state: "visible",
      timeout: 30000,
    });

    // 4. Verify Results
    const outputImage = await page.getByTestId("output-image");
    expect(outputImage).toBeTruthy();

    // Optional: Check if the output image is different from input
    const outputSrc = await outputImage.getAttribute("src");
    expect(outputSrc).not.toBeNull();
    expect(outputSrc).not.toContain("placeholder");

    // 5. Verify Credits Deducted
    const remainingCredits = await page
      .getByTestId("user-credits")
      .textContent();
    const initialCredits = CREDITS_TO_BUY;
    const expectedRemainingCredits = initialCredits - 10; // Assuming each generation costs 10 credits
    expect(parseInt(remainingCredits || "0")).toBeLessThanOrEqual(
      expectedRemainingCredits,
    );
  });

  test("Error Handling: Invalid Photo Upload", async ({ page }) => {
    // Ensure user is signed in first
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /continue/i }).click();

    // Try uploading an invalid image type or corrupted file
    const invalidImagePath = "./e2e/invalid-image.txt"; // Create a text file as an invalid "image"
    const uploadInput = await page.getByLabel(/upload/i);

    // Attempt to upload invalid file
    await uploadInput.setInputFiles(invalidImagePath);

    // Check for error message
    const errorMessage = await page.getByTestId("upload-error");
    expect(errorMessage).toBeTruthy();
    expect(await errorMessage.textContent()).toContain("Invalid image");
  });
});
