const path = require('path')

module.exports = {
  entry: path.join(__dirname, 'app', 'index.tsx'),
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: '/node_modules/',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      // {
      //   test: /\.(png|svg|jpg|jpeg|gif)$/i,
      //   type: "asset/resource",
      //   generator: {
      //     filename: 'static/[hash][ext][query]'
      //   }
      // },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'out', 'app'),
  },
}
