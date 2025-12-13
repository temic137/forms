# Testing & Using Quiz Mode

## 1. How to Test Locally
Since you cannot share the public link with others while running on `localhost`, you can simulate other users yourself.

1.  **Start your server**: Ensure `npm run dev` is running.
2.  **Open the Form**:
    *   Go to your dashboard and open the quiz you created.
    *   Click the **Preview** button (eye icon) in the top right.
    *   *OR* copy the share link (e.g., `http://localhost:3000/f/your-form-id`) and open it in an **Incognito/Private Window**. This ensures you are treated as a "guest" and not the owner.
3.  **Submit a Response**: Fill out the quiz and submit.
    *   You should see your score immediately on the thank you page.
4.  **Check Analytics**:
    *   Go back to your main window (dashboard).
    *   Click on the form card.
    *   Go to the **Submissions** tab.
    *   You will see the new "Quiz Performance" section with the score from your test submission.

## 2. Setting Correct Answers Manually
I have updated the form builder so you can now set correct answers for any field you add manually.

**How to use it:**
1.  **Enable Quiz Mode**:
    *   In the builder, click **Settings** (gear icon) → **Quiz Mode**.
    *   Toggle it **ON**.
2.  **Add a Field**:
    *   Add a question (e.g., Short Answer, Multiple Choice).
3.  **Set the Answer**:
    *   Click on the field to edit it.
    *   Scroll to the bottom of the field card.
    *   You will see a new **"Quiz Answer"** section (green icon).
    *   Enter the **Points**, **Correct Answer**, and optional **Explanation**.

This works for all supported field types (Text, Number, Date, Select, Checkbox).

