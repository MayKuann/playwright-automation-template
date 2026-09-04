# Writing local tests

Keep tests focused on behaviour a user or API consumer can observe.

1. Copy `spec-template.spec.ts` into a feature folder.
2. Rename the suite and test in plain language.
3. Navigate, perform one user action, and assert the visible result.
4. Run the test in UI mode before adding it to a larger suite.

Use page objects for reusable page actions and locators. Keep business expectations in the test itself, so its purpose remains easy to read.
