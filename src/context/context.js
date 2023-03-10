import React, { useState, useEffect } from "react";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
	const [githubUser, setGithubUser] = useState({});
	const [repos, setRepos] = useState([]);
	const [followers, setFollowers] = useState([]);
	const [requests, setRequests] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState({ show: false, msg: "" });

	const searchGithubUser = async (user) => {
		toggleError();
		setIsLoading(true);
		const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
			console.log(error)
		);
		if (response) {
			setGithubUser(response.data);
			const { login, followers_url } = response.data;
			await Promise.allSettled([
				axios(`${rootUrl}/users/${login}/repos?per_page=100`),
				axios(`${followers_url}?per_page=100`),
			])
				.then((results) => {
					const [repos, followers] = results;
					const status = "fulfilled";
					if (repos.status === status) {
						setRepos(repos.value.data);
					}
					if (followers.status === status) {
						setFollowers(followers.value.data);
					}
				})
				.catch((err) => console.log(err));
		} else {
			toggleError(true, "There is no user with that username!");
		}
		checkRequests();
		setIsLoading(false);
	};

	const checkRequests = () => {
		axios(`${rootUrl}/rate_limit`)
			.then(({ data }) => {
				let {
					rate: { remaining },
				} = data;
				setRequests(remaining);
				if (remaining === 0) {
					toggleError(true, "Sorry you have exceeded you hourly limit!");
				}
			})
			.catch((err) => console.log(err));
	};
	const toggleError = (show = false, msg = "") => {
		setError({ show, msg });
	};
	useEffect(checkRequests, []);
	return (
		<GithubContext.Provider
			value={{
				searchGithubUser,
				error,
				githubUser,
				repos,
				followers,
				requests,
				isLoading,
			}}
		>
			{children}
		</GithubContext.Provider>
	);
};

export { GithubContext, GithubProvider };
