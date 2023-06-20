/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import Bills from "../containers/Bills.js";

import mockStore from "../__mocks__/store"
import router from "../app/Router"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.className).toEqual('active-icon')

    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe('Then I click on one of the eye icons', () => {
      test('should display modal open', () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        const billsContainer = new Bills({
          document, onNavigate, store: null, bills, localStorage: window.localStorage
        })

        document.body.innerHTML = BillsUI({ data: bills })
        $.fn.modal = jest.fn(); // Without the modal cannot be opened
        const iconEyes = screen.getAllByTestId('icon-eye')
        const handleClickIconEye = jest.fn(icon => billsContainer.handleClickIconEye(icon))
        iconEyes.forEach(icon => icon.addEventListener('click', handleClickIconEye(icon)))

        userEvent.click(iconEyes[0])
        expect(handleClickIconEye).toHaveBeenCalled()
      })
    })

    describe('Then when i click on "Nouvelle note de frais"', () => {
      test('should redirect to "New bill page"', async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        const billsContainer = new Bills({
          document, onNavigate, store: null, bills, localStorage: window.localStorage
        })

        document.body.innerHTML = BillsUI({ data: bills })

        const btn = screen.getByTestId('btn-new-bill')

        const handleClick = jest.fn(() => billsContainer.handleClickNewBill())
        btn.addEventListener('click', handleClick)
        userEvent.click(btn)
        expect(handleClick).toHaveBeenCalled()
        await waitFor(() => screen.getByTestId('title'))
        expect(screen.getByTestId('title').textContent.trim()).toEqual('Envoyer une note de frais')
      })
    })
  })
})

// GET
describe("When I am on the Bills Page", () => {
  test("fetches bills from the mock API using GET", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "a@a" })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
    await waitFor(() => screen.getByTestId('btn-new-bill'))
    expect(screen.getByTestId('title-content').textContent).toEqual('Mes notes de frais')
    expect(screen.getByTestId('tbody')).toBeTruthy()
  });
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Admin',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
