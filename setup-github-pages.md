# Setting Up SVG Builder on GitHub Pages

This guide will help you set up the SVG Builder application on GitHub Pages.

## Steps

1. **Create a GitHub Repository**
   - Go to [GitHub](https://github.com) and sign in to your account
   - Click the "+" icon in the top right corner and select "New repository"
   - Name your repository (e.g., "svg-builder")
   - Choose whether to make it public or private
   - Click "Create repository"

2. **Push the Code to GitHub**
   - Open a terminal/command prompt
   - Navigate to your SVG Builder directory
   - Initialize a Git repository (if not already done):
     ```
     git init
     ```
   - Add all files:
     ```
     git add .
     ```
   - Commit the files:
     ```
     git commit -m "Initial commit"
     ```
   - Add your GitHub repository as the remote:
     ```
     git remote add origin https://github.com/yourusername/svg-builder.git
     ```
   - Push the code:
     ```
     git push -u origin main
     ```
     (Use `master` instead of `main` if your default branch is named `master`)

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click on "Settings"
   - Scroll down to the "GitHub Pages" section
   - Under "Source", select the branch you want to deploy (usually `main` or `master`)
   - Click "Save"
   - GitHub will provide you with a URL where your site is published (e.g., `https://yourusername.github.io/svg-builder/`)

4. **Verify the Deployment**
   - Visit the URL provided by GitHub
   - You should see the SVG Builder application running
   - If there are any issues, check the repository settings and make sure all files are correctly pushed

## Troubleshooting

- **404 Error**: Make sure your repository is public or that you have GitHub Pages enabled for private repositories
- **Missing Assets**: Ensure all file paths in your HTML, CSS, and JavaScript files are relative and correct
- **JavaScript Errors**: Check the browser console for any errors and fix them in your code

## Updating Your Site

To update your site after making changes:

1. Make your changes locally
2. Commit them:
   ```
   git add .
   git commit -m "Description of changes"
   ```
3. Push to GitHub:
   ```
   git push
   ```

GitHub Pages will automatically update your site with the new changes. 