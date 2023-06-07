/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills.js"
import router from "../app/Router"
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    test("Then new bill icon (mail) in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.className).toEqual('active-icon')
    })

    test('Then all fields should be present', async () => {
      await waitFor(() => screen.getByTestId('expense-name'))
      expect(screen.getByTestId('expense-name')).toBeTruthy()
      expect(screen.getByTestId('datepicker')).toBeTruthy()
      expect(screen.getByTestId('amount')).toBeTruthy()
      expect(screen.getByTestId('vat')).toBeTruthy()
      expect(screen.getByTestId('pct')).toBeTruthy()
      expect(screen.getByTestId('commentary')).toBeTruthy()
      expect(screen.getByTestId('file')).toBeTruthy()
    })
  })
  describe('When I am on NewBill Page and i fill all fields', () => {
    test('Then i submit form, function called and redirect to Bills page', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a",
        password: "a@a",
        status: "connected",
      }))

      const newBill = new NewBill({
        document, onNavigate, store: null, bills, localStorage: window.localStorage
      })
      document.body.innerHTML = NewBillUI()
      await waitFor(() => screen.getByTestId('form-new-bill'))

      const form = screen.getByTestId('form-new-bill')
      const handleForm = jest.fn((e) => newBill.handleSubmit(e))
      screen.getByTestId('expense-type').value = "IT et électronique"
      screen.getByTestId('expense-name').value = "Achat d'un clavier"
      screen.getByTestId('datepicker').value = "2023-6-6"
      screen.getByTestId('amount').value = 10
      screen.getByTestId('vat').value = 20
      screen.getByTestId('pct').value = 5
      screen.getByTestId('commentary').value = "Petit test"

      form.addEventListener('submit', (e) => handleForm(e))
      fireEvent.submit(form)
      expect(handleForm).toHaveBeenCalled()
      expect(screen.getByTestId('title-content').textContent).toEqual('Mes notes de frais')
    })
  })
  describe('When I am on NewBill Page', () => {

    test('Then i upload invalid file type', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      await waitFor(() => screen.getByTestId('file'))
      const file = screen.getByTestId('file')
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      /* fireEvent.change(getByLabelText(/picture/i), {
        target: {
          files: [new File(['(⌐□_□)'], 'chucknorris.png', {type: 'image/png'})],
        },
      }) */
      file.addEventListener('change', (e) => handleChangeFile(e))
      fireEvent.change(file, {
        target: {
          files: [new File(['(⌐□_□)'], 'chucknorris.mp3', { type: 'audio/mp3' })],
        }
      })
      expect(handleChangeFile).toHaveBeenCalled()
      expect(newBill.fileUrl).toBeNull();
      expect(file.getAttribute("data-error-visible")).toBeTruthy()
      expect(file.getAttribute('data-error')).toBe("Seuls les fichiers au format JPEG, JPG et PNG sont acceptés.")
    })
    test('Then i upload valid format type', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      await waitFor(() => screen.getByTestId('file'))
      const file = screen.getByTestId('file')
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      /* fireEvent.change(getByLabelText(/picture/i), {
      }) */
      file.addEventListener('change', (e) => handleChangeFile(e))
      fireEvent.change(file, {
        target: {
          files: [new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' })],
        },
      })
      expect(handleChangeFile).toHaveBeenCalled()
      expect(file.getAttribute("data-error-visible")).not.toBeTruthy()
    })
  })
})

//POST
describe("Given I am user connected as Employee", () => {
  describe('When i select valid file', () => {
    test('Then the API returns fileUrl and key', async () => {
      const response = await mockStore.bills().create(bills[0])
      expect(response.fileUrl).not.toBeUndefined()
      expect(response.key).not.toBeUndefined()
    })
  })
  describe("When i submit valid form", () => {
    test('Then the API returns an object containing my sent data', async () => {
      const response = await mockStore.bills().update(bills[0])
      expect(response.id).toBe(bills[0].id)
      expect(response.email).toBe(bills[0].email)
      expect(response.name).toBe(bills[0].name)
      expect(response.type).toBe(bills[0].type)
    })
  })
})