const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { SERVICENOW_INSTANCE, JS_API_PATH, IMG_API_PATH, ASSETS_API_PATH } = require('./servicenow.config');

module.exports = {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `${JS_API_PATH}[name]-[fullhash]-js`,
        chunkFilename: `${JS_API_PATH}[name]-[chunkhash]-js`,
        assetModuleFilename: `${ASSETS_API_PATH}[name]-[hash][ext][query]`,
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|jpg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: `${IMG_API_PATH}[name]-[hash][ext][query]`
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.svg$/,
                use: ['@svgr/webpack'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new MiniCssExtractPlugin({
            filename: `${ASSETS_API_PATH}[name]-[contenthash].css`,
            chunkFilename: `${ASSETS_API_PATH}[id]-[contenthash].css`,
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 3000,
        proxy: {
            '/api': {
                target: SERVICENOW_INSTANCE,
                changeOrigin: true,
            },
        },
    },
};

